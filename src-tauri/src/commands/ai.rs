use crate::state::AppState;
use std::process::Stdio;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;

const AI_TIMEOUT: Duration = Duration::from_secs(180);
const LATEX_ASSIST_TIMEOUT: Duration = Duration::from_secs(600);

fn resolve_timeout(override_secs: Option<u64>, default: Duration) -> Duration {
    match override_secs {
        Some(s) if s > 0 => Duration::from_secs(s),
        _ => default,
    }
}

fn provider_bin(provider: &str) -> &str {
    match provider {
        "codex" => "codex",
        "agy" => "agy",
        "gemini" => "gemini",
        "opencode" => "opencode",
        _ => "claude",
    }
}

pub(crate) fn cli_path() -> &'static str {
    use std::sync::OnceLock;
    static PATH: OnceLock<String> = OnceLock::new();
    PATH.get_or_init(|| {
        let mut dirs: Vec<String> = Vec::new();
        let mut add = |d: String| {
            if !d.is_empty() && !dirs.iter().any(|x| x == &d) {
                dirs.push(d);
            }
        };
        if let Ok(p) = std::env::var("PATH") {
            for d in p.split(':') {
                add(d.to_string());
            }
        }
        for d in [
            "/opt/homebrew/bin",
            "/opt/homebrew/sbin",
            "/usr/local/bin",
            "/usr/local/sbin",
            "/opt/local/bin",
            "/opt/local/sbin",
            "/usr/bin",
            "/bin",
        ] {
            add(d.to_string());
        }
        if let Ok(home) = std::env::var("HOME") {
            for d in [
                ".local/bin",
                ".opencode/bin",
                ".cargo/bin",
                ".bun/bin",
                ".deno/bin",
                ".npm-global/bin",
                ".claude/local",
            ] {
                add(format!("{home}/{d}"));
            }
        }
        dirs.join(":")
    })
}

pub(crate) fn cli_command(bin: &str) -> Command {
    let mut cmd = Command::new(bin);
    cmd.env("PATH", cli_path());
    cmd
}

fn add_model(cmd: &mut Command, flag: &str, model: Option<&str>) {
    if let Some(m) = model.map(str::trim).filter(|m| !m.is_empty()) {
        cmd.arg(flag).arg(m);
    }
}

fn apply_cwd(cmd: &mut Command, cwd: Option<&str>) {
    if let Some(dir) = cwd {
        if !dir.is_empty() && std::path::Path::new(dir).is_dir() {
            cmd.current_dir(dir);
        }
    }
}

#[allow(dead_code)]
fn cli_detail(stdout: &[u8], stderr: &[u8]) -> String {
    let err = String::from_utf8_lossy(stderr).trim().to_string();
    if !err.is_empty() {
        return err;
    }
    String::from_utf8_lossy(stdout).trim().to_string()
}

fn exit_code(status: &std::process::ExitStatus) -> String {
    status
        .code()
        .map(|c| c.to_string())
        .unwrap_or_else(|| "signal".to_string())
}

fn cli_error(name: &str, code: &str, detail: &str) -> String {
    let low = detail.to_lowercase();
    if low.contains("not logged in")
        || low.contains("authenticat")
        || low.contains("please run")
        || (low.contains("api key") && (low.contains("missing") || low.contains("not ")))
        || low.contains("0 credentials")
    {
        format!("{name} isn't signed in — run `{name}` once in a terminal to log in, then retry.")
    } else if low.contains("rate limit")
        || low.contains("quota")
        || low.contains("429")
        || low.contains("overloaded")
    {
        format!("{name} hit a rate limit or quota — wait a moment and try again.")
    } else if low.contains("model")
        && (low.contains("not found")
            || low.contains("unknown")
            || low.contains("invalid")
            || low.contains("does not exist")
            || low.contains("not supported"))
    {
        format!("The model configured in Settings is not valid for {name}.")
    } else if (low.contains("context") && low.contains("length"))
        || low.contains("too many tokens")
        || low.contains("maximum context")
        || low.contains("prompt is too long")
    {
        "The LaTeX document/prompt is too large for the model's context window.".to_string()
    } else if detail.is_empty() {
        format!("{name} produced no output (exit {code}).")
    } else {
        let tail: String = detail
            .chars()
            .rev()
            .take(300)
            .collect::<Vec<_>>()
            .into_iter()
            .rev()
            .collect();
        format!("{name} exited {code}: {tail}")
    }
}

fn feed_stdin(child: &mut tokio::process::Child, prompt: &str) {
    if let Some(mut sin) = child.stdin.take() {
        let bytes = prompt.as_bytes().to_vec();
        tauri::async_runtime::spawn(async move {
            let _ = sin.write_all(&bytes).await;
            let _ = sin.shutdown().await;
        });
    }
}

#[tauri::command]
pub async fn ai_available(provider: String) -> bool {
    if provider == "openai" {
        return true;
    }
    cli_command(provider_bin(&provider))
        .arg("--version")
        .output()
        .await
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[tauri::command]
pub async fn ai_cancel(
    app: AppHandle,
    state: State<'_, AppState>,
    key: String,
) -> Result<(), String> {
    let was_running = {
        let mut t = state
            .ai_tasks
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        match t.remove(&key) {
            Some(handle) => {
                handle.abort();
                true
            }
            None => false,
        }
    };
    if let Ok(mut s) = state.ai_inflight.lock() {
        s.remove(&key);
    }
    if was_running {
        let _ = app.emit(
            "ai:done",
            serde_json::json!({ "key": key, "ok": false, "error": "Canceled", "canceled": true }),
        );
    }
    Ok(())
}

#[tauri::command]
pub async fn ai_stream(
    app: AppHandle,
    state: State<'_, AppState>,
    key: String,
    provider: String,
    prompt: String,
    cwd: Option<String>,
    base_url: Option<String>,
    model: Option<String>,
    api_key: Option<String>,
    timeout_secs: Option<u64>,
) -> Result<(), String> {
    {
        let mut set = state
            .ai_inflight
            .lock()
            .unwrap_or_else(std::sync::PoisonError::into_inner);
        if set.contains(&key) {
            return Ok(());
        }
        set.insert(key.clone());
    }

    let inflight = state.ai_inflight.clone();
    let tasks = state.ai_tasks.clone();
    let task_key = key.clone();

    let handle = tauri::async_runtime::spawn(async move {
        let _ = app.emit(
            "ai:progress",
            serde_json::json!({
                "key": &task_key,
                "provider": &provider,
                "phase": "starting",
                "message": format!("Starting session with {}", provider),
                "model": &model,
            }),
        );

        let result = stream_provider(
            &app,
            &task_key,
            &provider,
            &prompt,
            cwd.as_deref(),
            base_url,
            model,
            api_key,
            timeout_secs,
        )
        .await;

        if let Ok(mut s) = inflight.lock() {
            s.remove(&task_key);
        }
        if let Ok(mut t) = tasks.lock() {
            t.remove(&task_key);
        }

        let payload = match result {
            Ok((text, cost)) => serde_json::json!({
                "key": task_key,
                "ok": true,
                "output": text,
                "costUsd": cost,
            }),
            Err(e) => serde_json::json!({
                "key": task_key,
                "ok": false,
                "error": e,
            }),
        };
        let _ = app.emit("ai:complete", payload);
    });

    if let Ok(mut t) = state.ai_tasks.lock() {
        t.insert(key, handle);
    }

    Ok(())
}

async fn stream_provider(
    app: &AppHandle,
    key: &str,
    provider: &str,
    prompt: &str,
    cwd: Option<&str>,
    base_url: Option<String>,
    model: Option<String>,
    api_key: Option<String>,
    timeout_secs: Option<u64>,
) -> Result<(String, Option<f64>), String> {
    match provider {
        "claude" => stream_claude(app, key, prompt, cwd, model.as_deref(), timeout_secs).await,
        "agy" => stream_agy(app, key, prompt, cwd, model.as_deref(), timeout_secs).await,
        "gemini" => stream_gemini(app, key, prompt, cwd, model.as_deref(), timeout_secs).await,
        "opencode" => stream_opencode(app, key, prompt, cwd, model.as_deref(), timeout_secs).await,
        "codex" => stream_codex(app, key, prompt, cwd, model.as_deref(), timeout_secs).await,
        "openai" => stream_openai(app, key, prompt, base_url, model, api_key, timeout_secs).await,
        _ => Err(format!("Unsupported provider: {provider}")),
    }
}

async fn stream_claude(
    app: &AppHandle,
    key: &str,
    prompt: &str,
    cwd: Option<&str>,
    model: Option<&str>,
    timeout_secs: Option<u64>,
) -> Result<(String, Option<f64>), String> {
    let mut cmd = cli_command("claude");
    cmd.arg("-p")
        .arg("--output-format")
        .arg("stream-json")
        .arg("--include-partial-messages")
        .arg("--verbose")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);

    add_model(&mut cmd, "--model", model);
    apply_cwd(&mut cmd, cwd);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn claude: {e}"))?;
    feed_stdin(&mut child, prompt);

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "claude: no stdout".to_string())?;
    let mut stderr = child.stderr.take();
    let stderr_task = tauri::async_runtime::spawn(async move {
        let mut bytes = Vec::new();
        if let Some(ref mut stream) = stderr {
            let _ = stream.read_to_end(&mut bytes).await;
        }
        bytes
    });

    let mut lines = BufReader::new(stdout).lines();
    let mut full = String::new();
    let mut noise = String::new();
    let mut cost: Option<f64> = None;
    let idle = resolve_timeout(timeout_secs, LATEX_ASSIST_TIMEOUT);

    let read_loop = async {
        loop {
            let line = match tokio::time::timeout(idle, lines.next_line()).await {
                Ok(result) => result.map_err(|e| format!("read claude: {e}"))?,
                Err(_) => {
                    return Err(format!(
                        "Claude produced no activity for {}s and was stopped.",
                        idle.as_secs()
                    ));
                }
            };
            let Some(line) = line else { break };
            if line.is_empty() {
                continue;
            }
            let Ok(v) = serde_json::from_str::<serde_json::Value>(&line) else {
                if noise.len() < 1000 {
                    noise.push_str(line.trim());
                    noise.push('\n');
                }
                continue;
            };

            match v.get("type").and_then(|t| t.as_str()) {
                Some("system") if v.get("subtype").and_then(|s| s.as_str()) == Some("init") => {
                    let _ = app.emit(
                        "ai:progress",
                        serde_json::json!({
                            "key": key,
                            "provider": "claude",
                            "phase": "thinking",
                            "message": "Claude session ready",
                            "model": v.get("model").and_then(|x| x.as_str()),
                            "sessionId": v.get("session_id").and_then(|x| x.as_str()),
                        }),
                    );
                }
                Some("stream_event") => {
                    let ev = v.get("event");
                    let event_type = ev.and_then(|e| e.get("type")).and_then(|k| k.as_str());
                    if event_type == Some("message_start") {
                        let message = ev.and_then(|e| e.get("message"));
                        let usage = message.and_then(|m| m.get("usage"));
                        let _ = app.emit(
                            "ai:progress",
                            serde_json::json!({
                                "key": key,
                                "provider": "claude",
                                "phase": "writing",
                                "message": "Generating LaTeX...",
                                "model": message.and_then(|m| m.get("model")).and_then(|x| x.as_str()),
                                "inputTokens": usage.and_then(|u| u.get("input_tokens")).and_then(|x| x.as_u64()),
                                "cachedTokens": usage.and_then(|u| u.get("cache_read_input_tokens")).and_then(|x| x.as_u64()),
                            }),
                        );
                    }
                    if event_type == Some("content_block_delta") {
                        let delta = ev.and_then(|e| e.get("delta"));
                        if delta.and_then(|d| d.get("type")).and_then(|t| t.as_str())
                            == Some("text_delta")
                        {
                            if let Some(txt) =
                                delta.and_then(|d| d.get("text")).and_then(|t| t.as_str())
                            {
                                full.push_str(txt);
                                let _ = app.emit(
                                    "ai:chunk",
                                    serde_json::json!({ "key": key, "delta": txt }),
                                );
                            }
                        }
                    }
                }
                Some("result") => {
                    if let Some(r) = v.get("result").and_then(|r| r.as_str()) {
                        if !r.is_empty() {
                            full = r.to_string();
                        }
                    }
                    cost = v.get("total_cost_usd").and_then(|c| c.as_f64());
                }
                _ => {}
            }
        }
        Ok::<(), String>(())
    };

    read_loop.await?;
    let status = child.wait().await.ok();
    let stderr = stderr_task.await.unwrap_or_default();
    if noise.len() < 1000 && !stderr.is_empty() {
        noise.push_str(&String::from_utf8_lossy(&stderr));
    }
    if let Some(status) = status.as_ref() {
        if !status.success() {
            return Err(cli_error("claude", &exit_code(status), noise.trim()));
        }
    }
    if full.is_empty() {
        let code = status.map(|s| exit_code(&s)).unwrap_or_else(|| "?".into());
        return Err(cli_error("claude", &code, noise.trim()));
    }
    Ok((full, cost))
}

async fn stream_agy(
    app: &AppHandle,
    key: &str,
    prompt: &str,
    cwd: Option<&str>,
    model: Option<&str>,
    timeout_secs: Option<u64>,
) -> Result<(String, Option<f64>), String> {
    let mut cmd = cli_command("agy");
    cmd.arg("-p")
        .arg(prompt)
        .arg("--output-format")
        .arg("stream-json")
        .arg("--dangerously-skip-permissions")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);

    add_model(&mut cmd, "--model", model);
    apply_cwd(&mut cmd, cwd);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn agy: {e}"))?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "agy: no stdout".to_string())?;
    let mut stderr = child.stderr.take();
    let stderr_task = tauri::async_runtime::spawn(async move {
        let mut bytes = Vec::new();
        if let Some(ref mut stream) = stderr {
            let _ = stream.read_to_end(&mut bytes).await;
        }
        bytes
    });

    let mut lines = BufReader::new(stdout).lines();
    let mut full = String::new();
    let idle = resolve_timeout(timeout_secs, LATEX_ASSIST_TIMEOUT);

    let read_loop = async {
        loop {
            let line = match tokio::time::timeout(idle, lines.next_line()).await {
                Ok(result) => result.map_err(|e| format!("read agy: {e}"))?,
                Err(_) => {
                    return Err(format!(
                        "Antigravity produced no activity for {}s and was stopped.",
                        idle.as_secs()
                    ));
                }
            };
            let Some(line) = line else { break };
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&line) {
                match v.get("event").and_then(|x| x.as_str()) {
                    Some("init") => {
                        let _ = app.emit(
                            "ai:progress",
                            serde_json::json!({
                                "key": key,
                                "provider": "agy",
                                "phase": "starting",
                                "message": "Antigravity initialized",
                                "model": model,
                            }),
                        );
                    }
                    Some("step_update") => {
                        let step = v.get("step_update");
                        if let Some(delta) = step
                            .and_then(|s| s.get("text_delta"))
                            .and_then(|d| d.as_str())
                        {
                            if !delta.is_empty() {
                                full.push_str(delta);
                                let _ = app.emit(
                                    "ai:chunk",
                                    serde_json::json!({ "key": key, "delta": delta }),
                                );
                            }
                        }
                    }
                    Some("result") => {
                        if full.is_empty() {
                            if let Some(resp) = v
                                .get("result")
                                .and_then(|r| r.get("response"))
                                .and_then(|s| s.as_str())
                            {
                                full = resp.to_string();
                            }
                        }
                    }
                    _ => {}
                }
            }
        }
        Ok::<(), String>(())
    };

    read_loop.await?;
    let status = child.wait().await.map_err(|e| format!("wait agy: {e}"))?;
    let stderr = stderr_task.await.unwrap_or_default();
    if !status.success() {
        return Err(cli_error(
            "agy",
            &exit_code(&status),
            &String::from_utf8_lossy(&stderr),
        ));
    }
    let trimmed = full.trim().to_string();
    if trimmed.is_empty() {
        return Err(cli_error(
            "agy",
            &exit_code(&status),
            &String::from_utf8_lossy(&stderr),
        ));
    }
    Ok((trimmed, None))
}

async fn stream_gemini(
    app: &AppHandle,
    key: &str,
    prompt: &str,
    cwd: Option<&str>,
    model: Option<&str>,
    timeout_secs: Option<u64>,
) -> Result<(String, Option<f64>), String> {
    let mut cmd = cli_command("gemini");
    cmd.arg("-p")
        .arg(prompt)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);

    add_model(&mut cmd, "-m", model);
    apply_cwd(&mut cmd, cwd);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn gemini: {e}"))?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "gemini: no stdout".to_string())?;
    let mut stderr = child.stderr.take();
    let stderr_task = tauri::async_runtime::spawn(async move {
        let mut bytes = Vec::new();
        if let Some(ref mut stream) = stderr {
            let _ = stream.read_to_end(&mut bytes).await;
        }
        bytes
    });

    let mut lines = BufReader::new(stdout).lines();
    let mut full = String::new();
    let idle = resolve_timeout(timeout_secs, LATEX_ASSIST_TIMEOUT);

    let read_loop = async {
        loop {
            let line = match tokio::time::timeout(idle, lines.next_line()).await {
                Ok(result) => result.map_err(|e| format!("read gemini: {e}"))?,
                Err(_) => {
                    return Err(format!(
                        "Gemini produced no activity for {}s and was stopped.",
                        idle.as_secs()
                    ));
                }
            };
            let Some(line) = line else { break };
            let chunk = format!("{line}\n");
            full.push_str(&chunk);
            let _ = app.emit(
                "ai:chunk",
                serde_json::json!({ "key": key, "delta": chunk }),
            );
        }
        Ok::<(), String>(())
    };

    read_loop.await?;
    let status = child
        .wait()
        .await
        .map_err(|e| format!("wait gemini: {e}"))?;
    let stderr = stderr_task.await.unwrap_or_default();
    if !status.success() {
        return Err(cli_error(
            "gemini",
            &exit_code(&status),
            &String::from_utf8_lossy(&stderr),
        ));
    }
    let trimmed = full.trim().to_string();
    if trimmed.is_empty() {
        return Err(cli_error(
            "gemini",
            &exit_code(&status),
            &String::from_utf8_lossy(&stderr),
        ));
    }
    Ok((trimmed, None))
}

async fn stream_opencode(
    app: &AppHandle,
    key: &str,
    prompt: &str,
    cwd: Option<&str>,
    model: Option<&str>,
    timeout_secs: Option<u64>,
) -> Result<(String, Option<f64>), String> {
    let mut cmd = cli_command("opencode");
    cmd.arg("run")
        .arg(prompt)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);

    add_model(&mut cmd, "-m", model);
    apply_cwd(&mut cmd, cwd);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn opencode: {e}"))?;
    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "opencode: no stdout".to_string())?;
    let mut stderr = child.stderr.take();
    let stderr_task = tauri::async_runtime::spawn(async move {
        let mut bytes = Vec::new();
        if let Some(ref mut stream) = stderr {
            let _ = stream.read_to_end(&mut bytes).await;
        }
        bytes
    });

    let mut lines = BufReader::new(stdout).lines();
    let mut full = String::new();
    let idle = resolve_timeout(timeout_secs, LATEX_ASSIST_TIMEOUT);

    let read_loop = async {
        loop {
            let line = match tokio::time::timeout(idle, lines.next_line()).await {
                Ok(result) => result.map_err(|e| format!("read opencode: {e}"))?,
                Err(_) => {
                    return Err(format!(
                        "OpenCode produced no activity for {}s and was stopped.",
                        idle.as_secs()
                    ));
                }
            };
            let Some(line) = line else { break };
            let chunk = format!("{line}\n");
            full.push_str(&chunk);
            let _ = app.emit(
                "ai:chunk",
                serde_json::json!({ "key": key, "delta": chunk }),
            );
        }
        Ok::<(), String>(())
    };

    read_loop.await?;
    let status = child
        .wait()
        .await
        .map_err(|e| format!("wait opencode: {e}"))?;
    let stderr = stderr_task.await.unwrap_or_default();
    if !status.success() {
        return Err(cli_error(
            "opencode",
            &exit_code(&status),
            &String::from_utf8_lossy(&stderr),
        ));
    }
    let trimmed = full.trim().to_string();
    if trimmed.is_empty() {
        return Err(cli_error(
            "opencode",
            &exit_code(&status),
            &String::from_utf8_lossy(&stderr),
        ));
    }
    Ok((trimmed, None))
}

async fn stream_codex(
    app: &AppHandle,
    key: &str,
    prompt: &str,
    cwd: Option<&str>,
    model: Option<&str>,
    timeout_secs: Option<u64>,
) -> Result<(String, Option<f64>), String> {
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let mut out_path = std::env::temp_dir();
    out_path.push(format!("underleaf-codex-stream-{nanos}.md"));

    let mut cmd = cli_command("codex");
    cmd.arg("exec")
        .arg("--skip-git-repo-check")
        .arg("-s")
        .arg("read-only")
        .arg("--json")
        .arg("--output-last-message")
        .arg(&out_path);
    add_model(&mut cmd, "-m", model);
    cmd.arg("-")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .kill_on_drop(true);
    apply_cwd(&mut cmd, cwd);

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Failed to spawn codex: {e}"))?;
    feed_stdin(&mut child, prompt);

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "codex: no stdout".to_string())?;
    let mut stderr = child.stderr.take();
    let stderr_task = tauri::async_runtime::spawn(async move {
        let mut bytes = Vec::new();
        if let Some(ref mut stream) = stderr {
            let _ = stream.read_to_end(&mut bytes).await;
        }
        bytes
    });

    let mut lines = BufReader::new(stdout).lines();
    let idle = resolve_timeout(timeout_secs, LATEX_ASSIST_TIMEOUT);

    let read_loop = async {
        loop {
            let line = match tokio::time::timeout(idle, lines.next_line()).await {
                Ok(result) => result.map_err(|e| format!("read codex: {e}"))?,
                Err(_) => {
                    return Err(format!(
                        "Codex produced no activity for {}s and was stopped.",
                        idle.as_secs()
                    ));
                }
            };
            let Some(line) = line else { break };
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(&line) {
                if let Some(t) = v.get("type").and_then(|x| x.as_str()) {
                    if t == "turn.started" {
                        let _ = app.emit(
                            "ai:progress",
                            serde_json::json!({
                                "key": key,
                                "provider": "codex",
                                "phase": "writing",
                                "message": "Codex generating answer...",
                                "model": model,
                            }),
                        );
                    }
                }
            }
        }
        Ok::<(), String>(())
    };

    if let Err(error) = read_loop.await {
        let _ = tokio::fs::remove_file(&out_path).await;
        return Err(error);
    }
    let status = child.wait().await.map_err(|e| format!("wait codex: {e}"))?;
    let stderr = stderr_task.await.unwrap_or_default();
    if !status.success() {
        let _ = tokio::fs::remove_file(&out_path).await;
        return Err(cli_error(
            "codex",
            &exit_code(&status),
            &String::from_utf8_lossy(&stderr),
        ));
    }
    let text = tokio::fs::read_to_string(&out_path)
        .await
        .unwrap_or_default();
    let _ = tokio::fs::remove_file(&out_path).await;
    let text = text.trim().to_string();
    if text.is_empty() {
        return Err(cli_error(
            "codex",
            &exit_code(&status),
            &String::from_utf8_lossy(&stderr),
        ));
    }
    let _ = app.emit("ai:chunk", serde_json::json!({ "key": key, "delta": text }));
    Ok((text, None))
}

async fn stream_openai(
    app: &AppHandle,
    key: &str,
    prompt: &str,
    base_url: Option<String>,
    model: Option<String>,
    api_key: Option<String>,
    timeout_secs: Option<u64>,
) -> Result<(String, Option<f64>), String> {
    let base = base_url.unwrap_or_default();
    let base = base.trim().trim_end_matches('/');
    if base.is_empty() {
        return Err("No endpoint configured — set a Base URL in Settings → AI Provider.".into());
    }
    let model = model.unwrap_or_default();
    let model = model.trim();
    if model.is_empty() {
        return Err(
            "No model configured — select or enter a Model in Settings → AI Provider.".into(),
        );
    }
    let url = format!("{base}/chat/completions");
    let body = serde_json::json!({
        "model": model,
        "messages": [{ "role": "user", "content": prompt }],
        "stream": true,
        "temperature": 0.2,
    });
    let client = reqwest::Client::builder()
        .timeout(resolve_timeout(timeout_secs, AI_TIMEOUT))
        .build()
        .map_err(|e| format!("HTTP client error: {e}"))?;

    let mut req = client.post(&url).json(&body);
    if let Some(k) = api_key.as_deref() {
        if !k.trim().is_empty() {
            req = req.bearer_auth(k.trim());
        }
    }

    let res = req
        .send()
        .await
        .map_err(|e| format!("Request to {base} failed: {e}"))?;
    if !res.status().is_success() {
        let status = res.status().as_u16();
        let text = res.text().await.unwrap_or_default();
        return Err(format!("{base} returned {status}: {text}"));
    }

    let mut full = String::new();
    let mut buf = String::new();
    let mut res_stream = res;

    while let Some(bytes) = res_stream
        .chunk()
        .await
        .map_err(|e| format!("Stream error: {e}"))?
    {
        buf.push_str(&String::from_utf8_lossy(&bytes));
        while let Some(nl) = buf.find('\n') {
            let line = buf[..nl].trim().to_string();
            buf.drain(..=nl);
            let Some(data) = line.strip_prefix("data:") else {
                continue;
            };
            let data = data.trim();
            if data.is_empty() || data == "[DONE]" {
                continue;
            }
            if let Ok(v) = serde_json::from_str::<serde_json::Value>(data) {
                if let Some(delta) = v
                    .get("choices")
                    .and_then(|c| c.get(0))
                    .and_then(|c| c.get("delta"))
                    .and_then(|d| d.get("content"))
                    .and_then(|c| c.as_str())
                {
                    if !delta.is_empty() {
                        full.push_str(delta);
                        let _ = app.emit(
                            "ai:chunk",
                            serde_json::json!({ "key": key, "delta": delta }),
                        );
                    }
                }
            }
        }
    }

    if full.is_empty() {
        return Err("Endpoint returned no content.".into());
    }
    Ok((full, None))
}

#[tauri::command]
pub async fn ai_apply(
    provider: String,
    prompt: String,
    cwd: String,
    model: Option<String>,
) -> Result<String, String> {
    if !std::path::Path::new(&cwd).is_dir() {
        return Err("Project directory is invalid or unavailable".into());
    }
    const APPLY_TIMEOUT: Duration = Duration::from_secs(600);

    match provider.as_str() {
        "claude" => {
            let mut cmd = cli_command("claude");
            cmd.arg("-p")
                .arg(&prompt)
                .arg("--dangerously-skip-permissions")
                .arg("--output-format")
                .arg("text")
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .kill_on_drop(true);
            apply_cwd(&mut cmd, Some(&cwd));
            let output = tokio::time::timeout(
                APPLY_TIMEOUT,
                cmd.spawn().map_err(|e| format!("{e}"))?.wait_with_output(),
            )
            .await
            .map_err(|_| "Apply took longer than 10 minutes".to_string())?
            .map_err(|e| format!("{e}"))?;
            if !output.status.success() {
                return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
            }
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        }
        "agy" => {
            let mut cmd = cli_command("agy");
            cmd.arg("-p")
                .arg(&prompt)
                .arg("--mode")
                .arg("accept-edits")
                .arg("--dangerously-skip-permissions")
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .kill_on_drop(true);
            add_model(&mut cmd, "--model", model.as_deref());
            apply_cwd(&mut cmd, Some(&cwd));
            let output = tokio::time::timeout(
                APPLY_TIMEOUT,
                cmd.spawn().map_err(|e| format!("{e}"))?.wait_with_output(),
            )
            .await
            .map_err(|_| "Apply took longer than 10 minutes".to_string())?
            .map_err(|e| format!("{e}"))?;
            if !output.status.success() {
                return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
            }
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        }
        "gemini" => {
            let mut cmd = cli_command("gemini");
            cmd.arg("-p")
                .arg(&prompt)
                .arg("--yolo")
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .kill_on_drop(true);
            add_model(&mut cmd, "-m", model.as_deref());
            apply_cwd(&mut cmd, Some(&cwd));
            let output = tokio::time::timeout(
                APPLY_TIMEOUT,
                cmd.spawn().map_err(|e| format!("{e}"))?.wait_with_output(),
            )
            .await
            .map_err(|_| "Apply took longer than 10 minutes".to_string())?
            .map_err(|e| format!("{e}"))?;
            if !output.status.success() {
                return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
            }
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        }
        "opencode" => {
            let mut cmd = cli_command("opencode");
            cmd.arg("run")
                .arg(&prompt)
                .stdin(Stdio::null())
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .kill_on_drop(true);
            add_model(&mut cmd, "-m", model.as_deref());
            apply_cwd(&mut cmd, Some(&cwd));
            let output = tokio::time::timeout(
                APPLY_TIMEOUT,
                cmd.spawn().map_err(|e| format!("{e}"))?.wait_with_output(),
            )
            .await
            .map_err(|_| "Apply took longer than 10 minutes".to_string())?
            .map_err(|e| format!("{e}"))?;
            if !output.status.success() {
                return Err(String::from_utf8_lossy(&output.stderr).trim().to_string());
            }
            Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
        }
        _ => Err("This provider does not support direct file workspace modification.".into()),
    }
}

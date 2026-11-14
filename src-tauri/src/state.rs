use std::collections::{HashMap, HashSet};
use std::sync::{Arc, Mutex};
use tauri::async_runtime::JoinHandle;

#[derive(Default, Clone)]
pub struct AppState {
    pub ai_tasks: Arc<Mutex<HashMap<String, JoinHandle<()>>>>,
    pub ai_inflight: Arc<Mutex<HashSet<String>>>,
}

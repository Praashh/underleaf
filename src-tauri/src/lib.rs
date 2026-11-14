mod commands;
mod state;

use commands::ai::{ai_apply, ai_available, ai_cancel, ai_stream};
use commands::compile::compile_latex;
use commands::export::{export_pdf, get_pdf_bytes};
use commands::project::{
    create_project, delete_project, list_projects, read_project_file, rename_project,
    save_project_file,
};
use state::AppState;

#[cfg(target_os = "macos")]
fn set_macos_dock_icon() {
    use objc2::AnyThread;
    use objc2::MainThreadMarker;
    use objc2_app_kit::{NSApplication, NSImage};
    use objc2_foundation::NSData;

    unsafe {
        let icon_bytes = include_bytes!("../icons/icon.png");
        let ns_data = NSData::with_bytes(icon_bytes);
        let image = NSImage::initWithData(NSImage::alloc(), &ns_data);
        if let (Some(img), Some(mtm)) = (image, MainThreadMarker::new()) {
            let app = NSApplication::sharedApplication(mtm);
            app.setApplicationIconImage(Some(&img));
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let state = AppState::default();
    tauri::Builder::default()
        .manage(state)
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            compile_latex,
            list_projects,
            create_project,
            read_project_file,
            save_project_file,
            delete_project,
            rename_project,
            export_pdf,
            get_pdf_bytes,
            ai_available,
            ai_stream,
            ai_cancel,
            ai_apply,
        ])
        .setup(|_app| {
            #[cfg(target_os = "macos")]
            set_macos_dock_icon();

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Underleaf");
}

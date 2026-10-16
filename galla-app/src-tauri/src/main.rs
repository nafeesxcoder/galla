// The desktop app is the same React Native code as the phone, running in a
// webview that Tauri puts inside a native window. Nothing of the shop lives
// here - this file opens a window and gets out of the way.

// On Windows, stop a console window opening behind the app in a release
// build. A shopkeeper double-clicking an icon should not get a black box.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    galla_lib::run()
}

use std::path::{Path, PathBuf};

pub fn examples_dir() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../examples")
        .canonicalize()
        .expect("examples/ should exist")
}

pub fn example_files() -> Vec<PathBuf> {
    let mut files = Vec::new();
    collect_cantrip(&examples_dir(), &mut files);
    files.sort();
    files
}

fn collect_cantrip(dir: &Path, out: &mut Vec<PathBuf>) {
    let Ok(entries) = std::fs::read_dir(dir) else {
        return;
    };
    for entry in entries.flatten() {
        let path = entry.path();
        if path.is_dir() {
            collect_cantrip(&path, out);
        } else if path.extension().is_some_and(|ext| ext == "cantrip") {
            out.push(path);
        }
    }
}

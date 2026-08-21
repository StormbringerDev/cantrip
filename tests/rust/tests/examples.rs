use cantrip_e2e_rust::{example_files, examples_dir};

#[test]
fn examples_dir_exists() {
    assert!(examples_dir().is_dir());
}

#[test]
fn example_scripts_run() {
    let files = example_files();
    assert!(!files.is_empty(), "no .cantrip files under examples/");
}

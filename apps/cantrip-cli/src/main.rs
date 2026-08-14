//! Cantrip CLI - the main `cantrip` binary.

use std::{path::PathBuf, process::exit};

use clap::Parser;

/// CLI arguments for Cantrip.
#[derive(Parser)]
#[command(name = "cantrip", about = "The CLI for the Cantrip interpreter")]
#[command(version)]
struct Cli {
    /// Optional relative or absolute file path.
    path: Option<PathBuf>,
}

fn main() {
    let cli = Cli::parse();

    if cli.path.is_none() {
        println!("The REPL for Cantrip has not yet been implemented in Rust.");
        println!("To run the REPL, run 'pnpm run repl' in the terminal.");
        exit(1);
    } else {
        println!("The Cantrip bytecode VM has not yet been implemented.");
        println!("To run the REPL, run 'pnpm run repl' in the terminal.");
        exit(1);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_file_arg() {
        let cli = Cli::try_parse_from(["cantrip", "script.ctrp"]).unwrap();
        assert_eq!(cli.path.unwrap(), PathBuf::from("script.ctrp"));
    }

    #[test]
    fn test_no_args() {
        let cli = Cli::try_parse_from(["cantrip"]).unwrap();
        assert!(cli.path.is_none());
    }

    #[test]
    fn test_too_many_args() {
        let cli = Cli::try_parse_from(["cantrip", "script1.ctrp", "script2.ctrp"]);
        assert!(cli.is_err());
    }
}

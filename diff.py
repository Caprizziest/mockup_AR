import os
import subprocess

# Daftar commit milik Caprizziest (Oct 1, 2026)
COMMITS = [
    {
        "hash": "637ce9d",
        "title": "revisi",
    },
]

OUTPUT_DIR = "diff_output_oct1"
COMBINED_FILE = "caprizziest_all_diffs_oct1.txt"


def run_git_command(args):
    """Menjalankan perintah git dan mengembalikan output teksnya."""
    result = subprocess.run(
        ["git"] + args,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8",
    )
    if result.returncode != 0:
        print(f"[Error] Git command failed: {result.stderr.strip()}")
        return None
    return result.stdout


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("Memproses export git show per commit...")
    all_diffs = []

    # 1. Export masing-masing commit ke file terpisah
    for item in COMMITS:
        commit_hash = item["hash"]
        commit_title = item["title"]

        output = run_git_command(["show", commit_hash])
        if output is None:
            continue

        filename = os.path.join(
            OUTPUT_DIR, f"commit_{commit_hash}_{commit_title}.txt"
        )
        with open(filename, "w", encoding="utf-8") as f:
            f.write(output)

        print(f"  -> Disimpan: {filename}")
        all_diffs.append(output)

    # 2. Simpan gabungan semua diff ke satu file .txt
    combined_path = os.path.join(OUTPUT_DIR, COMBINED_FILE)
    with open(combined_path, "w", encoding="utf-8") as f:
        f.write(("\n\n" + ("=" * 80) + "\n\n").join(all_diffs))

    print(f"\nSelesai! Gabungan semua diff disimpan ke: {combined_path}")


if __name__ == "__main__":
    main()
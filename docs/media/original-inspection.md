# Local media-original inspection (research lane only)

After independently retrieving the exact original file from Wikimedia Commons, inspect it offline:

```sh
node scripts/inspect-media-original.mjs --id research-schumacher-portrait-2007 --file /absolute/path/to/original.jpg
node scripts/inspect-media-original.mjs --id research-schumacher-portrait-2007 --file /absolute/path/to/original.jpg --expected-sha256 <64-hex>
node --test tests/media-original-inspection.test.mjs
```

For Schumacher and Silverstone, the CLI automatically cross-checks the local original against pinned Commons SHA-1, byte count and dimensions in `docs/media/commons-original-evidence.json`. The manifest records **observed** source-page revisions, not approvals or a cryptographically strong Commons SHA-256. The CLI also accepts `--expected-sha1 40hex`, `--expected-bytes N`, and `--expected-sha256 64hex` for additional independent checks. SHA-1 is retained only because Commons publishes it; the locally calculated SHA-256 is the stronger artifact checksum. Do not confuse a Commons description-page `oldid` with a binary file revision.\n\nThe inspector reads from a validated, no-follow file descriptor and checks file identity and modification metadata across the read, limiting symlink/path-swap and concurrent-modification races. The inspector checks local JPEG/PNG signatures, structural JPEG SOF/SOS/EOI markers, PNG chunk boundaries/CRC/IEND, dimensions and an 80-million-pixel ceiling, a 40 MiB file limit, symlinks, staged MIME and dimensions (when known), and the exact SHA-256 of the inspected bytes. It rejects non-candidate staging entries and duplicate research IDs. The output is a JSON report with explicit unresolved checks; it does not modify the registry or publish any image.

**Important limits:** This is not a complete JPEG/PNG decoder, malware scanner, Commons download or license verifier. A structurally valid file can still be undecodable or unsafe to process elsewhere. An independently recorded Commons file revision, authoritative original checksum, creator/license attribution, historical subject identity, EN/UK captions and independent human rights review are still required. A SHA-256 calculated from an arbitrary local file is not proof that it came from Commons. The source SHA-1 and byte-count match improve traceability but cannot by themselves establish legal rights or source authenticity. Keep local originals outside the repository until rights and content review are complete.

See `docs/media/commons-primary-source-checks-2026-10-23.md` for source-page research and `scripts/export-media-review-packet.mjs` for the human-review worklist.

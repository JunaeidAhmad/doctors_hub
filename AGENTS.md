# Rules for the specialty search fix

Context: Doctors Hub. Django REST backend, React web frontend, Flutter patient app.
Full plan: docs/specialty-fix-plan.md. Do only the task you are given.

- Do NOT run any git command. This project is not using git for this work.
- Before editing a file for the first time, copy it to backups/<today>/<same relative path>.
- Find files by searching; never assume a path. If a file named in the task does not exist, stop and report what you found instead.
- Change only what the task asks. No unrelated refactors, renames or formatting passes.
- Keep every existing API response key under /api/v1/. Adding keys is allowed; removing or renaming is not.
- Every new user-facing string needs both English and Bangla versions.
- After editing, run the project's tests and linters. Fix failures you caused.
- End with a report: files changed, commands run, test results, anything you could not do.

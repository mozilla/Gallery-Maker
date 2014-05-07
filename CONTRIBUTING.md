# Contribution Guidelines

## Reporting issues

- **Search for existing issues.** Please check to see if someone else has reported the same issue in our [bug tracker](https://bugzilla.mozilla.org/buglist.cgi?product=Webmaker).
- **Share as much information as possible.** Include operating system and version, browser and version. Also, include steps to reproduce the bug.

## Code Style

### JavaScript

JS files must pass JSHint.

**TL;DR** – Run `gulp` before pushing a commit. It will validate your JS.

## Testing

Any patch should be tested in as many of our [supported browsers](https://github.com/mozilla/webmaker-profile/wiki/Browser-Support) as possible. Obviously, access to all devices is rare, so just aim for the best coverage possible. At a minimum please test in all available desktop browsers.

## Pull requests

- Try not to pollute your pull request with unintended changes – keep them simple and small. If possible, squash your commits.
- Try to share which browsers and devices your code has been tested in before submitting a pull request.

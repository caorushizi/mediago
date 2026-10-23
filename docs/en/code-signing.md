---
layout: doc
outline: deep
---

# Code signing policy

Updated: 24 October 2026.

## Current status

MediaGo is preparing an application to [SignPath Foundation](https://signpath.org/) for Windows code signing. Approval and integration are **pending**. We do not currently claim that SignPath signs MediaGo. Existing unsigned Windows releases, including 3.6.0-beta.1, remain unsigned. macOS signing/notarization is a separate process.

When Windows signing becomes available, the download page and release notes will identify the first signed release, its verified publisher identity and verification instructions. Signing does not certify that software has no defects.

## Source and release approval

The source repository is [mediago-dev/mediago](https://github.com/mediago-dev/mediago). Builds submitted for signing must be traceable to reviewed source and GitHub-hosted build artifacts. Signing and publishing a production release require a human maintainer's approval; maintenance automation is not a production signing approver.

The project maintainer and initial release-approval contact is [caorushizi](https://github.com/caorushizi). Committers and reviewers are the maintainers authorized for this repository; signing roles must be assigned explicitly, and users assigned signing roles must use MFA for GitHub and SignPath. Changes to build/signing workflows require the same review as product code.

## Signing scope and verification

Only approved MediaGo application and installer artifacts may be submitted under the project's signing policy. Third-party tools retain their upstream provenance and licenses; their presence in a package does not make them MediaGo-authored binaries or imply a MediaGo signature on every bundled file. See the [third-party notices](https://github.com/mediago-dev/mediago/blob/master/THIRD_PARTY_NOTICES.md).

The planned Windows process must verify the actual Authenticode publisher, timestamp and final artifacts before publication, with update checks rejecting unsigned, modified or wrong-publisher installers. We will not invent a publisher name, bypass verification, or describe a test signature as publicly trusted. Old unsigned clients need a documented transition to the first trusted installation.

## Privacy and contact

[Privacy policy](./privacy.md): TalkingData statistics are optional and require a separate user choice. Signing approval does not enable analytics.

For signing questions contact [84996057@qq.com](mailto:84996057@qq.com). Please do not send private keys, certificate passwords or tokens. Future SignPath attribution will be added after approval and actual signed distribution, following the [Foundation conditions](https://signpath.org/terms).

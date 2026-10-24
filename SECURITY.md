# Security Policy / 安全政策

## Supported versions

Security fixes primarily target the latest stable release of MediaGo. Reports affecting the latest prerelease or the default branch are also welcome; prereleases are intended for testing and do not carry the same stability expectations as stable releases.

| Version                              | Security handling                                                        |
| ------------------------------------ | ------------------------------------------------------------------------ |
| Latest stable release                | Primary target for security fixes                                        |
| Latest prerelease and default branch | Reports assessed for upcoming releases                                   |
| Older releases                       | Backports considered case by case; ongoing maintenance is not guaranteed |

When possible, check whether the issue also occurs in the latest applicable release. If upgrading is not possible, include the affected version and deployment constraints in your report. Available versions and published fixes are listed in [Releases](https://github.com/mediago-dev/mediago/releases).

## Reporting a vulnerability

Please report suspected security vulnerabilities privately through [GitHub Security Advisories](https://github.com/mediago-dev/mediago/security/advisories). Sign in to GitHub and select **Report a vulnerability**.

Do not disclose an unpatched vulnerability or its exploit details in a public issue, discussion, or pull request. Use public [Issues](https://github.com/mediago-dev/mediago/issues) for ordinary bugs and feature requests that do not expose a security risk.

Include the information relevant to your finding:

- Affected release or commit, component, and installation method, such as desktop, Docker, or a source build.
- Operating system, architecture, and relevant deployment or network configuration, including whether authentication is enabled.
- Reproduction steps and a minimal example that can be tested in a controlled environment.
- Expected and actual behavior, potential impact, and any permissions or access required.
- Sanitized logs or screenshots, and suggested fixes if available.

Never include real passwords, cookies, API tokens, signing keys, or other private credentials. Remove secrets and personal data from configuration files, logs, URLs, and screenshots before attaching them. Use dummy credentials in examples.

## Review and coordinated disclosure

Reports are assessed according to their impact and maintainer availability. Maintainers may request additional information and discuss affected versions, remediation, and coordinated disclosure through the private report. There is no guaranteed response time, fix deadline, or backport schedule.

Please coordinate public disclosure with the maintainers so users have an opportunity to obtain a fix. A proposed or merged change is not necessarily available in a published release; check the release notes for availability.

## 支持范围

MediaGo 的安全修复主要面向最新稳定版，也接受最新预发布版和默认分支的安全报告。预发布版用于测试，其稳定性预期与稳定版不同。

| 版本                   | 安全问题处理方式                   |
| ---------------------- | ---------------------------------- |
| 最新稳定版             | 安全修复的主要目标版本             |
| 最新预发布版及默认分支 | 评估报告，并用于后续版本修复       |
| 旧版本                 | 按具体情况考虑回补，不保证持续维护 |

条件允许时，请确认问题是否也出现在最新的适用版本中；如果暂时无法升级，请说明受影响版本和部署限制。已发布版本及修复说明见 [Releases](https://github.com/mediago-dev/mediago/releases)。

## 私密报告漏洞

请通过 [GitHub Security Advisories](https://github.com/mediago-dev/mediago/security/advisories) 私密报告疑似安全漏洞。登录 GitHub 后，点击 **Report a vulnerability**。

请不要在公开 Issue、Discussion 或 PR 中披露尚未修复的漏洞及利用细节。不涉及安全风险的普通缺陷和功能建议可以提交到公开的 [Issues](https://github.com/mediago-dev/mediago/issues)。

请根据问题提供相关信息：

- 受影响版本或提交、组件，以及桌面端、Docker 或源码运行等安装方式。
- 操作系统、架构和相关部署或网络配置，包括是否启用身份验证。
- 复现步骤，以及可在受控环境中测试的最小示例。
- 预期与实际行为、可能影响，以及复现所需的权限或访问条件。
- 脱敏日志或截图；如有修复建议，也欢迎一并提供。

不要提交真实密码、Cookie、API Token、签名密钥或其他私密凭据。附加配置、日志、链接和截图前，请移除敏感信息及个人数据，示例中使用虚构凭据。

## 评估与协调披露

报告将根据影响和维护者可用时间进行评估。维护者可能通过私密报告补充确认信息，并讨论受影响版本、修复方式和披露安排。不保证固定响应时间、修复期限或旧版本回补计划。

请与维护者协调公开披露时间，让用户有机会获取修复。提出或合并修复不代表已经发布，请以版本更新说明为准。

# Accessibility

Remanga Enhanced is committed to making reading, navigation, customization, and automation on ReManga accessible to as many people as possible.

We want everyone to be able to install, configure, use, and contribute to the project, regardless of their abilities, devices, or preferred input methods.

This document describes our accessibility goals, contributor expectations, known limitations, and the process for reporting accessibility barriers.

## Priorities

We aim to follow the Web Content Accessibility Guidelines (WCAG 2.2) Level AA. This is an accessibility goal, not a verified conformance claim.

Our priorities include:

- Keyboard navigation and clearly visible focus indicators.
- Screen reader compatibility and meaningful labels for interactive elements.
- Readable typography and sufficient color contrast.
- Responsive interfaces that accommodate different screen sizes and zoom levels.
- Alternatives to interactions that rely exclusively on hovering, color, or mouse input.
- Respect for reduced-motion preferences.
- Clear feedback for errors, notifications, and ongoing operations.
- Accessible documentation and installation instructions.

Accessibility should be considered throughout development, rather than treated as a separate final step.

## Contributor expectations

Contributors should consider accessibility when introducing or modifying user-facing features.

For interface changes:

- Prefer native, semantic HTML elements.
- Ensure interactive controls can be operated using a keyboard.
- Provide accessible names for buttons, inputs, and icon-only controls.
- Maintain logical focus order and appropriate focus management in dialogs.
- Avoid communicating important information through color alone.
- Consider text scaling, narrow screens, and reduced-motion preferences.
- Ensure that dynamic notifications and operation results are accessible.
- Avoid introducing unnecessary accessibility regressions.

Contributors should follow the [Design System](DESIGN.md), [Contribution Guidelines](CONTRIBUTING.md), and [Developer Guide](docs/DEVELOPER_GUIDE.md).

Pull requests should describe relevant accessibility considerations, manual checks performed, and any remaining limitations.

The project currently provides linting, build, and syntax checks. These checks do not establish accessibility compliance. Dedicated automated accessibility testing is not currently part of the project's verification process.

## Reporting accessibility issues

If you encounter an accessibility barrier, please contact us through one of the following channels:

- [GitHub Bug Reports](https://github.com/dev-leva1/remanga-ext/issues/new?template=bug_report.yml)
- [Telegram Feedback Bot](https://t.me/remanga_extension_bot)

Reports in Russian and English are welcome.

When possible, include:

- The feature or task you were trying to use.
- The affected page or URL.
- What happened and what you expected to happen.
- Your extension version, browser, and operating system.
- Your userscript manager.
- Any relevant assistive technology or input method.

Screenshots, recordings, and additional diagnostic information are optional.

You are not required to disclose a disability, medical condition, or other personal information.

### Severity

Accessibility issues are prioritized according to their impact on users.

| Severity | Description | Example |
| --- | --- | --- |
| Critical | Prevents a user from completing an essential task with no reasonable workaround. | Settings cannot be accessed or a dialog traps keyboard focus. |
| High | Creates a significant barrier to an important feature. | An essential control cannot be operated using a keyboard. |
| Medium | Makes a feature difficult to use, but a workaround exists. | Insufficient contrast or incomplete screen reader announcements. |
| Low | Causes a minor accessibility or usability inconvenience. | Inconsistent labels or nonessential visual inconsistencies. |

These levels provide guidance for maintainers during triage. Reporters do not need to determine severity themselves.

### How we respond

Maintainers aim to:

- Review accessibility reports as availability permits.
- Request additional information when necessary.
- Assess the impact and prioritize significant barriers.
- Suggest temporary workarounds when available.
- Track confirmed issues and communicate relevant progress.
- Invite reporters to verify fixes when appropriate.

As a community-maintained project, Remanga Enhanced does not guarantee specific response or resolution times.

## Ownership and maintenance

Accessibility is a shared responsibility among project maintainers and contributors.

The project maintainer, [dev-leva1](https://github.com/dev-leva1), is responsible for coordinating accessibility improvements, reviewing reported barriers, and maintaining this document.

Accessibility practices should be reviewed when significant interface changes are introduced and during release preparation.

When project ownership or maintenance responsibilities change, responsibility for this document and unresolved accessibility issues should be transferred to the incoming maintainers.

## Supported environments

Remanga Enhanced is designed to work within ReManga through compatible userscript managers.

| Browser | Userscript manager |
| --- | --- |
| Google Chrome | Tampermonkey |
| Microsoft Edge | Tampermonkey |
| Mozilla Firefox | Tampermonkey |
| Safari | Stay |

We aim to accommodate:

- Desktop and mobile devices.
- Keyboard, mouse, and touch input.
- Browser zoom and text scaling.
- Screen readers and other assistive technologies.

The extension's interface and most documentation are currently available in Russian, with an English README also provided.

These environments represent intended compatibility. Comprehensive accessibility testing across browser, device, operating system, and assistive technology combinations has not yet been completed.

## Known limitations

Remanga Enhanced is under active development, and some accessibility barriers may remain.

Current limitations identified through source-code review include:

- User profile tooltips rely primarily on mouse-hover interactions, which can limit access for keyboard and touch users.
- Some interface controls suppress default focus outlines, potentially making keyboard navigation difficult.
- Dialog focus management and keyboard navigation require further evaluation and improvement.
- Dynamic notifications and progress updates may not be announced reliably by screen readers.
- Comprehensive reduced-motion support and testing across assistive technologies have not yet been completed.

Remanga Enhanced also depends on the underlying ReManga interface. Accessibility barriers originating from ReManga, browsers, or userscript managers may be outside the project's direct control.

Where available, users can disable individual interface enhancements through extension settings or use the original ReManga interface instead.

A formal accessibility evaluation has not yet been conducted. The absence of a documented issue should not be interpreted as confirmation that no accessibility barrier exists.

## Feedback and improvements

We welcome suggestions for improving the accessibility of Remanga Enhanced, its documentation, and its contribution processes.

You can propose improvements through [GitHub Issues](https://github.com/dev-leva1/remanga-ext/issues) or contribute directly through pull requests.

If you are currently experiencing an accessibility barrier, please use the reporting process described above.

Accessibility is an ongoing commitment, and this document will evolve alongside the project.

# Accessibility Testing Guide

> **WCAG 2.1 AA Compliance Testing**
>
> This document provides comprehensive guidelines for testing accessibility features in the Work Management application.

## 📋 Table of Contents

- [Automated Testing](#automated-testing)
  - [Lighthouse](#lighthouse)
  - [axe DevTools](#axe-devtools)
- [Manual Testing](#manual-testing)
  - [Keyboard Navigation](#keyboard-navigation)
  - [Screen Reader Testing](#screen-reader-testing)
- [Testing Checklist](#testing-checklist)
- [Known Issues](#known-issues)

## 🤖 Automated Testing

### Lighthouse

**Tool**: Chrome DevTools built-in Lighthouse

**How to Run:**

1. Open Chrome DevTools (F12)
2. Navigate to the "Lighthouse" tab
3. Select "Accessibility" category
4. Choose "Desktop" or "Mobile" device
5. Click "Analyze page load"

**Target Score**: 95+ (AAA rating)

**Key Metrics to Check:**
- ✅ Contrast ratios (minimum 4.5:1 for normal text, 3:1 for large text)
- ✅ ARIA attributes validity
- ✅ Form labels and descriptions
- ✅ Heading hierarchy
- ✅ Link and button accessibility names
- ✅ Image alt text

**Recommended Pages to Test:**
- `/en/work-logs` - Main work log table with complex interactions
- `/en/admin/teams` - Team management with forms
- `/en/admin/projects` - Project management
- `/en/dashboard` - Dashboard with charts and statistics

### axe DevTools

**Tool**: Browser extension for Chrome/Firefox/Edge

**Installation:**
```bash
# Chrome Web Store
https://chrome.google.com/webstore/detail/axe-devtools-web-accessib/lhdoppojpmngadmnindnejefpokejbdd

# Firefox Add-ons
https://addons.mozilla.org/en-US/firefox/addon/axe-devtools/
```

**How to Run:**

1. Install axe DevTools extension
2. Open Chrome DevTools (F12)
3. Navigate to the "axe DevTools" tab
4. Click "Scan ALL of my page"
5. Review issues by severity

**Issue Priority Levels:**
- 🔴 **Critical**: Must fix immediately (blocker for accessibility)
- 🟡 **Serious**: Should fix before release
- 🟠 **Moderate**: Fix when possible
- 🔵 **Minor**: Nice to have improvements

**What to Check:**
- ARIA usage and validity
- Color contrast
- Keyboard accessibility
- Form field labels
- Semantic HTML structure
- Focus management

## 🎯 Manual Testing

### Keyboard Navigation

**Goal**: Ensure all interactive elements are keyboard accessible

**Testing Steps:**

1. **Tab Navigation**
   - [ ] Press `Tab` to navigate forward through interactive elements
   - [ ] Press `Shift + Tab` to navigate backward
   - [ ] Verify focus indicators are clearly visible (3px outline)
   - [ ] Ensure logical tab order (top-to-bottom, left-to-right)

2. **Skip Links**
   - [ ] Press `Tab` on page load
   - [ ] Verify "作業ログ一覧へスキップ" (Skip to work log list) link appears
   - [ ] Press `Enter` to activate skip link
   - [ ] Confirm focus moves to main content area

3. **Work Log Table**
   - [ ] Navigate to work log table
   - [ ] Press `?` to open keyboard shortcuts dialog
   - [ ] Verify dialog opens and shows shortcuts
   - [ ] Press `Esc` to close dialog
   - [ ] In batch edit mode:
     - [ ] `Ctrl + N` - Add new row
     - [ ] `Ctrl + D` - Duplicate selected row
     - [ ] `Delete` - Delete selected row
     - [ ] `Ctrl + Z` - Undo
     - [ ] `Ctrl + Y` or `Ctrl + Shift + Z` - Redo
   - [ ] Arrow keys navigate between cells
   - [ ] `Enter` starts/stops cell editing
   - [ ] `Tab` navigates to next cell
   - [ ] `Shift + Tab` navigates to previous cell

4. **Forms and Dialogs**
   - [ ] All form fields are reachable with `Tab`
   - [ ] Radio buttons navigable with arrow keys
   - [ ] `Esc` closes dialogs and modals
   - [ ] Enter submits forms (when appropriate)

### Screen Reader Testing

**Goal**: Ensure content is properly announced to screen reader users

#### VoiceOver (macOS)

**Activation**: `Cmd + F5`

**Basic Commands:**
- `Control + Option + →` - Navigate forward
- `Control + Option + ←` - Navigate backward
- `Control + Option + Space` - Activate element
- `Control + Option + H` - Next heading
- `Control + Option + L` - Next link
- `Control + Option + J` - Next form control

**Testing Checklist:**

1. **Page Structure**
   - [ ] Page title is announced on load
   - [ ] Headings are announced with level (h1, h2, etc.)
   - [ ] Landmarks are announced (navigation, main, etc.)

2. **Work Log Table**
   - [ ] Table structure is announced ("Table with X rows and Y columns")
   - [ ] Column headers are announced when entering cells
   - [ ] Row data is announced properly
   - [ ] Cell editing changes are announced via LiveRegion

3. **Forms**
   - [ ] Form field labels are announced
   - [ ] Required fields are indicated
   - [ ] Error messages are announced
   - [ ] Success messages are announced

4. **Live Regions**
   - [ ] Toast notifications are announced
   - [ ] Status updates are announced
   - [ ] Error messages are announced assertively
   - [ ] Success messages are announced politely

#### NVDA (Windows)

**Installation**: Download from https://www.nvaccess.org/

**Basic Commands:**
- `Down Arrow` - Next line
- `Up Arrow` - Previous line
- `Tab` - Next focusable element
- `H` - Next heading
- `K` - Next link
- `F` - Next form field
- `T` - Next table
- `B` - Next button

**Testing Checklist:**

1. **Page Navigation**
   - [ ] Browse mode works properly
   - [ ] Focus mode activates in form fields
   - [ ] Tables are announced with structure
   - [ ] Headings navigation works (H key)

2. **Forms and Interactions**
   - [ ] Form fields announce labels and values
   - [ ] Validation errors are announced
   - [ ] Dialog opening/closing is announced
   - [ ] Dynamic content updates are announced

#### JAWS (Windows)

**Installation**: Commercial software from Freedom Scientific

**Basic Commands:**
- `Down Arrow` - Next line (virtual mode)
- `H` - Next heading
- `T` - Next table
- `F` - Next form field
- `B` - Next button
- `Insert + F7` - List links
- `Insert + F5` - List form fields
- `Insert + F6` - List headings

**Testing Checklist:**

1. **Document Structure**
   - [ ] Page title read on load
   - [ ] Heading list shows proper hierarchy
   - [ ] Landmark navigation works

2. **Tables**
   - [ ] Table mode activates properly
   - [ ] Column/row headers are read
   - [ ] Cell navigation is smooth
   - [ ] Table summary (if present) is read

3. **Forms**
   - [ ] Forms mode activates in forms
   - [ ] Field types are announced
   - [ ] Required fields are indicated
   - [ ] Error messages are associated with fields

## ✅ Testing Checklist

### Pre-Release Checklist

Before each release, complete the following:

- [ ] **Automated Tests**
  - [ ] Lighthouse accessibility score 95+
  - [ ] axe DevTools shows no Critical or Serious issues
  - [ ] Zero violations of WCAG 2.1 Level AA

- [ ] **Keyboard Navigation**
  - [ ] All interactive elements reachable
  - [ ] Focus indicators visible (3px outline)
  - [ ] Logical tab order
  - [ ] Skip links functional
  - [ ] Keyboard shortcuts work as documented

- [ ] **Screen Readers**
  - [ ] Tested with at least 2 screen readers
  - [ ] All content is announced properly
  - [ ] Live regions announce updates
  - [ ] Forms are fully accessible

- [ ] **Visual Accessibility**
  - [ ] Color contrast meets WCAG AA (4.5:1 minimum)
  - [ ] Text is resizable up to 200% without loss of functionality
  - [ ] Focus indicators are clearly visible
  - [ ] No information conveyed by color alone

- [ ] **Documentation**
  - [ ] Keyboard shortcuts documented
  - [ ] Accessibility features documented
  - [ ] Known issues documented

### Testing Coverage by Page

| Page | Lighthouse | axe DevTools | Keyboard | VoiceOver | NVDA | JAWS |
|------|-----------|--------------|----------|-----------|------|------|
| `/work-logs` | ✅ | ✅ | ✅ | ⏳ | ⏳ | ⏳ |
| `/admin/teams` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `/admin/projects` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| `/dashboard` | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

✅ = Tested and passing
⏳ = Pending testing
❌ = Issues found

## 🐛 Known Issues

### Current Issues

1. **LiveRegion Message Timing** - FIXED (2025-11-03)
   - ✅ Increased message display time from 100ms to 1000ms
   - ✅ Implemented message key rotation for duplicate messages

2. **Skip Link Focus Management** - FIXED (2025-11-03)
   - ✅ Added `tabIndex={-1}` to grid section
   - ✅ Implemented focus() on skip link activation

3. **CSS Focus Indicators** - FIXED (2025-11-03)
   - ✅ Unified to 3px outline across all components
   - ✅ Added consistent z-index (10) for focus states
   - ✅ Added box-shadow for enhanced visibility

### Planned Improvements

- [ ] Add ARIA labels to all icon-only buttons
- [ ] Implement aria-describedby for complex form fields
- [ ] Add role descriptions for custom components
- [ ] Improve error message association in forms

## 📚 Resources

### WCAG 2.1 Guidelines
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [Understanding WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/)
- [How to Meet WCAG (Customizable Quick Reference)](https://www.w3.org/WAI/WCAG21/quickref/)

### Testing Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Screen Readers
- [VoiceOver User Guide](https://support.apple.com/guide/voiceover/welcome/mac)
- [NVDA User Guide](https://www.nvaccess.org/files/nvda/documentation/userGuide.html)
- [JAWS Screen Reader](https://www.freedomscientific.com/products/software/jaws/)

### ARIA Authoring Practices
- [ARIA Authoring Practices Guide (APG)](https://www.w3.org/WAI/ARIA/apg/)
- [Using ARIA](https://www.w3.org/TR/using-aria/)

## 🔄 Continuous Testing

### During Development

1. **Run automated tests** after each significant UI change
2. **Test keyboard navigation** for new interactive components
3. **Check color contrast** when adding or modifying colors
4. **Validate ARIA** usage when adding dynamic content

### Before Each PR

1. Run Lighthouse on affected pages
2. Run axe DevTools full page scan
3. Test keyboard navigation through changed flows
4. Document any accessibility implications in PR description

### Regular Audits

- **Monthly**: Full manual screen reader testing
- **Quarterly**: Complete WCAG 2.1 AA compliance audit
- **Per Release**: Full accessibility regression testing

---

**Last Updated**: 2025-11-03
**Document Version**: 1.0.0
**Maintainer**: Development Team

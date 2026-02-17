# Project: wot-is-gtm

## Overview
This is a learning/demo project for exploring Google Tag Manager (GTM) capabilities.
The developer is learning GTM from scratch — prioritize clear explanations and comments in code.

## Purpose
- Build a multi-page static website hosted on GitHub Pages
- Integrate Google Tag Manager properly
- Implement Google Consent Mode v2
- Learn how tags, triggers, and variables work in GTM
- Test various tracking scenarios (page views, clicks, form submissions, custom events)

## Tech Stack
- Pure HTML, CSS, vanilla JavaScript (no frameworks — keep it simple for learning)
- GitHub Pages for hosting
- Google Tag Manager for tag management
- Google Analytics 4 (GA4) as the primary analytics tool

## Project Structure
/
├── index.html          # Homepage
├── about.html          # About page
├── products.html       # Products page (for testing ecommerce-like events)
├── contact.html        # Contact page (for testing form submissions)
├── privacy.html        # Privacy policy page
├── css/
│   └── style.css       # Global styles
├── js/
│   ├── main.js         # Shared functionality
│   ├── consent.js      # Consent Mode logic
│   └── dataLayer.js    # GTM dataLayer push helpers
├── docs/
│   └── gtm-notes.md    # Learning notes and documentation
├── .claude/
│   ├── agents/         # Custom Claude agents
│   └── commands/       # Custom slash commands
└── CLAUDE.md           # This file

## Coding Standards
- Use semantic HTML5
- Comment everything thoroughly — this is a learning project
- Keep JavaScript simple and readable, no minification
- Use meaningful class names that describe purpose
- Every HTML page must include the GTM container snippet
- All pages share the same header/nav and footer

## GTM Concepts to Explore (In Order)
1. Basic GTM container setup and installation
2. Google Consent Mode v2 (default denied, update on user action)
3. Page view tracking with GA4
4. Click tracking (buttons, links)
5. Form submission tracking
6. Custom event tracking via dataLayer
7. Variable types (built-in, custom JS, dataLayer)
8. Trigger types (page view, click, custom event, timer)
9. Tag sequencing and firing priority
10. Debug mode and Tag Assistant

## Key Terminology
- **GTM Container**: A snippet of code that holds all your tags, triggers, and variables
- **dataLayer**: A JavaScript array that GTM reads to get information about your page/user
- **Tag**: A piece of code that executes (like GA4 tracking, Meta Pixel, etc.)
- **Trigger**: A condition that fires a tag (page load, button click, form submit, etc.)
- **Variable**: Dynamic values GTM can use (page URL, click text, dataLayer values, etc.)
- **Consent Mode**: Google's framework for adjusting tag behavior based on user consent choices
- **Default Denied**: Initial state where all tracking is blocked until user gives consent

## What NOT to Do
- Don't use real user data — this is a demo
- Don't add tracking without implementing consent first
- Don't use npm, webpack, or any build tools — keep it raw HTML/CSS/JS
- Don't overcomplicate the CSS — function over form
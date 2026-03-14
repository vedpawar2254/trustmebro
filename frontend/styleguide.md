# Style Guide

This document defines the design and coding standards for the **TrustMeBro landing page**.
All contributors should follow these guidelines to maintain consistency across the project.

---

## 1. Design Principles

* Keep the interface **clean and minimal**.
* Maintain **consistent spacing and typography**.
* Ensure the design is **responsive across devices**.
* Prioritize **clarity and readability** over decorative elements.
* Use components that are **reusable and modular**.

---

## 2. Layout Structure

The landing page follows this section order:

1. Navbar
2. Hero Section
3. Problem / Value Proposition
4. Features
5. How It Works
6. Pricing or Call-to-Action
7. Footer

Each section should be implemented as a **separate component** when possible.

Example structure:

```
components/
 ├── Navbar
 ├── Hero
 ├── Features
 ├── HowItWorks
 ├── Pricing
 └── Footer
```

---

## 3. Color Guidelines

Use a consistent color palette across the landing page to keep the design clean and readable.

Primary Color

Used for main buttons, links, and highlights.

Example:

Primary Blue: #2563EB
Hover: #1D4ED8
Secondary Color

Used for supporting UI elements like icons and secondary buttons.

Example:

Purple: #7C3AED
Hover: #6D28D9
Neutral Colors

Used for background, text, and layout balance.

Background: #F9FAFB
Primary Text: #111827
Secondary Text: #6B7280
Border: #E5E7EB
## 4. Typography

Guidelines:

* Use a **maximum of two font families**.
* Maintain consistent font hierarchy.

Example hierarchy:

* H1 → Main page headline
* H2 → Section headings
* H3 → Sub-sections
* Body → Paragraph text

Spacing between headings and content should remain consistent.

---

## 5. Spacing and Layout

Use consistent spacing rules.

Recommended spacing scale:

```
4px
8px
16px
24px
32px
48px
64px
```

Rules:

* Keep equal spacing between

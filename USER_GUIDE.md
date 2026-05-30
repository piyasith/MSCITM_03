# FlavorCritic User Guide

This guide explains how to use **FlavorCritic**, the restaurant review portal, from the perspective of everyday users, company representatives, and administrators. It is written to match the system’s functional requirements (FR-1 through FR-26) and the behaviour you will see in the application.

---

## Table of contents

1. [Introduction](#1-introduction)
2. [Getting started](#2-getting-started)
3. [Discovering restaurants and menu items](#3-discovering-restaurants-and-menu-items)
4. [Restaurant and menu profiles](#4-restaurant-and-menu-profiles)
5. [Writing reviews and ratings](#5-writing-reviews-and-ratings)
6. [Comments and company responses](#6-comments-and-company-responses)
7. [Managing your own content](#7-managing-your-own-content)
8. [Notifications and submission status](#8-notifications-and-submission-status)
9. [Reporting inappropriate content](#9-reporting-inappropriate-content)
10. [Top Rated and Trending lists](#10-top-rated-and-trending-lists)
11. [Company representative guide](#11-company-representative-guide)
12. [Administrator guide](#12-administrator-guide)
13. [How ratings and rankings work](#13-how-ratings-and-rankings-work)
14. [Status glossary](#14-status-glossary)
15. [Quick reference by requirement](#15-quick-reference-by-requirement)

---

## 1. Introduction

FlavorCritic helps diners:

- **Discover** restaurants and dishes
- **Read** moderated, authentic reviews
- **Share** structured feedback across multiple rating categories
- **Engage** through comments and official company responses

All user-generated content (reviews, comments, and company replies) passes through a **moderation queue** before it appears publicly. You can always see the status of your own submissions in **My Account**.

---

## 2. Getting started

### Who can use the system?

| Role | How to access | Main capabilities |
|------|---------------|-------------------|
| **Visitor** | No account needed | Browse, search, read approved content |
| **Registered user** | Register at **User Login → Register** | Submit reviews, comment, report content, manage own submissions |
| **Company representative** | Admin assigns this role to a user account | Post official responses to reviews for one restaurant |
| **Administrator** | **Admin Login** | Manage restaurants, moderate content, configure settings, view analytics |

### Creating a user account

1. Click **User Login** in the top navigation.
2. Choose **Register** (or go to `/user/register`).
3. Enter your **name**, **email**, and **password**.
4. After registration, log in with the same credentials.

Your session is stored in the browser. Use **Logout** in the header when finished on a shared device.

### Logging in as an administrator

1. Click **Admin Login** in the navigation.
2. Enter admin email and password.

On a fresh database, a default super admin is created automatically:

| Email | Password |
|-------|----------|
| `admin@example.com` | `admin123` |

Change this password after first login in production environments.

---

## 3. Discovering restaurants and menu items

### FR-1: Search restaurants

You can find restaurants in two ways:

#### From the homepage

1. Go to **Home** (`/`).
2. Use the search bar to type a **restaurant name** and press **Search**.
3. Click **Filters** to refine results:
   - **Cuisine** — e.g. Italian, Indian
   - **Location** — city or area
   - **Price range** — `$`, `$$`, `$$$`, or `$$$$`
   - **Dietary tags** — comma-separated, e.g. `vegetarian, vegan, gluten-free`
   - **Minimum rating** — 3+, 3.5+, 4+, or 4.5+
   - **Sort** — newest, by rating, or by most reviewed
4. Click **Apply** to refresh results, or **Clear** to reset filters.

Matching restaurants appear in the **All Restaurants** grid. Each card shows name, cuisine, price range, location, tags, star rating, and review count.

#### From the header search bar

1. Type a restaurant or dish name in the top search field.
2. Press **Search** — you are taken to the **Search Results** page.

The header search matches **restaurant names** and also finds **dishes** (see FR-2 below).

### FR-2: Search menu items across restaurants

On the **Search Results** page (`/search?q=...`):

- The top section lists matching **restaurants**.
- The lower section lists matching **dishes** from any restaurant.
- Use the **Filter by item category** field to narrow dishes (e.g. `Appetizer`, `Main Course`).

Each dish card shows:

- Item name and category
- Restaurant name
- Current **price**
- Availability badge if the item is temporarily unavailable
- A link to the parent restaurant

---

## 4. Restaurant and menu profiles

### FR-3: Restaurant profile

Click any restaurant card to open its profile page (`/restaurant/:id`). You will see:

| Information | Description |
|-------------|-------------|
| **Name & description** | Overview of the venue |
| **Address & location** | Full address and area |
| **Cuisine** | Primary cuisine and additional cuisine tags |
| **Price range** | `$` through `$$$$` |
| **Tags** | General tags (e.g. outdoor seating, family-friendly) |
| **Dietary tags** | e.g. vegetarian, halal |
| **Average rating** | Weighted score based on approved reviews only |
| **Review count** | Number of approved reviews contributing to the score |
| **Opening hours** | Day-by-day open/close times or “Closed” |
| **Photos** | Gallery with captions and alt text (retired photos are hidden) |
| **Customer reviews** | All **approved** reviews for this restaurant |

Trending restaurants also appear on the homepage under **Trending Now**.

### FR-4: Menu item details

On the same restaurant page, scroll to the **Menu** section. Each item displays:

- **Name** and **category**
- **Description**
- **Current price** (updated by admin; reflected immediately after save)
- **Photo** with optional caption
- **Unavailable** badge when the item is marked unavailable (still visible but clearly marked)

Only available, non-retired items are shown on the public menu.

---

## 5. Writing reviews and ratings

### FR-5 & FR-6: Submit a structured review

**Requirement:** You must be logged in as a registered user.

1. Open a restaurant profile.
2. Click **Write a Review** (or **Login to Write Review** if not signed in).
3. Complete the form:

#### Required rating categories (1–5 stars each)

| Category | What to rate |
|----------|--------------|
| **Food Quality** | Taste, presentation, portion quality |
| **Customer Service** | Staff attentiveness and professionalism |
| **Ambience & Cleanliness** | Atmosphere, décor, hygiene |
| **Value for Money** | Price relative to experience |
| **Booking / Experience** | Reservations, wait times, overall visit flow |

#### Optional fields

| Field | Purpose |
|-------|---------|
| **Miscellaneous rating** | Extra 1–5 score for anything not covered above |
| **Miscellaneous comments** | Free-text notes for the miscellaneous category |
| **Associate with a menu item** | Link your review to a specific dish you ordered |
| **Your review** | Main written review (required) |

4. Click **Submit Review**.

Your review enters the moderation queue with status **Pending**. It will **not** appear on the public restaurant page until a moderator **approves** it.

---

## 6. Comments and company responses

### FR-7: Comment on published reviews

Comments can only be added to **approved** (published) reviews.

1. On a restaurant page, find an approved review.
2. Click **Comments** to expand the thread.
3. If logged in, type in **Add a comment…** and click **Post**.
4. If not logged in, use the link to log in first.

Comments also start in **Pending** status and appear publicly only after approval.

### FR-8: Company responses

**Company representatives** (and administrators) may post an official reply to an approved review.

1. On an approved review, click **Respond**.
2. Type your official message.
3. Click **Submit Response (pending moderation)**.

Responses are moderated like reviews and comments. Once approved, they appear under the review labelled as a **Company** or **Admin** response.

---

## 7. Managing your own content

### FR-9: Edit and delete your submissions

Go to **My Account** (`/user/dashboard`) from the header.

#### My Reviews tab

- View all reviews you have submitted with their current **status**.
- **Edit** — change ratings, text, or linked menu item. After saving, the review returns to **Pending** for re-moderation (FR-9).
- **Delete** — permanently remove your review (confirmation required).

You can edit or delete while a review is still **Pending** (before a moderator decides). After publication, edits trigger re-moderation; the previous approved version remains visible until the edited version is approved again.

#### My Comments tab

- View all your comments and their status.
- **Edit** or **Delete** with the same re-moderation rules as reviews.

---

## 8. Notifications and submission status

### FR-24: Moderation decision notifications

When a moderator acts on your content, FlavorCritic sends an **in-app notification**:

- A bell icon in the header shows an unread count.
- Open **My Account → Notifications** to read messages.
- Click a notification to mark it as read, or use **Mark all read**.

Typical notifications include approval, rejection (with reason), or soft removal of your review, comment, or company response.

### FR-25: Status indicators for your submissions

In **My Account**, each submission displays a colour-coded status badge:

| Badge in app | Meaning | Public visibility |
|--------------|---------|-------------------|
| **pending** (amber) | Awaiting moderator decision | Not visible to others |
| **approved** (green) | Published | Visible on restaurant/review pages |
| **rejected** (red) | Not published | Hidden; reason may be shown to you |
| **removed** (grey) | Soft-removed by moderator | Hidden from public view |

> **Note:** The functional requirements refer to “Published” — in the application this corresponds to the **approved** status.

If your content was **rejected**, the rejection **reason code** (and optional detail) is shown on your submission in My Account.

---

## 9. Reporting inappropriate content

### FR-26: Report content mechanism

Logged-in users can flag reviews or comments they believe violate community standards.

1. On a restaurant page, open the review or comment you want to report.
2. Click the **Report** (flag) button.
3. Choose a **reason**:
   - spam
   - abuse
   - hate speech
   - misinformation
   - off topic
   - personal info
   - other
4. Optionally add **details**.
5. Click **Submit Report**.

Administrators review open reports in the admin panel. Repeated reports on the same content can trigger automatic escalation based on system settings.

---

## 10. Top Rated and Trending lists

### FR-18: Curated restaurant lists

Access **Top Rated** from the main navigation (`/top-rated`).

| List | Where shown | How it is built |
|------|-------------|-----------------|
| **Top Rated** | Top Rated page | Highest weighted scores among restaurants with enough approved reviews (see FR-16) |
| **Trending** | Homepage (top 4) and Top Rated page | Restaurants with strong recent review activity within a configurable time window |

Restaurant cards show weighted star rating and review count. Restaurants that do not yet meet the minimum review threshold may be excluded from Top Rated with a message explaining eligibility.

---

## 11. Company representative guide

A company representative is a registered user with the `company_rep` role, linked to exactly one restaurant.

### What you can do

- Log in like any user.
- Visit **your** restaurant’s profile page.
- On approved reviews, use **Respond** to submit an official reply.
- Manage your account and view notification history in **My Account**.

### What you cannot do

- Respond to reviews for other restaurants.
- Bypass moderation — all responses enter the **Pending** queue.

If you need company rep access, contact an administrator.

---

## 12. Administrator guide

Administrators use the **Admin Dashboard** (`/admin/dashboard`) after logging in at **Admin Login**.

The dashboard is organised into tabs:

| Tab | Related requirements | Purpose |
|-----|---------------------|---------|
| **Dashboard** | FR-23 | Analytics: review volumes, moderation SLA, trends, audit access |
| **Restaurants** | FR-19, FR-21, FR-22 | Create, edit, delete restaurants; manage photos and tags |
| **Menu Items** | FR-19, FR-20, FR-21 | Create, edit, delete dishes; set price and availability |
| **Moderate Reviews** | FR-10–FR-13, FR-14 | Approve, reject, soft-remove, escalate reviews |
| **Moderate Comments** | FR-10–FR-13 | Same workflow for comments |
| **Company Responses** | FR-10–FR-12 | Moderate official replies |
| **Reports** | FR-26 | Resolve user-submitted content reports |
| **Users** | FR-14 | View users, apply strikes, flag or ban accounts |
| **Tags & Cuisines** | FR-22 | Manage taxonomy for filtering and visibility |
| **Settings** | FR-15–FR-18, FR-14 | Configure weights, ranking rules, trending, escalation thresholds |
| **Admin Mgmt** | — | Super admins only: create and manage admin accounts |

### FR-10–FR-12: Moderating content

For reviews, comments, or company responses:

1. Open the relevant **Moderate** tab.
2. Filter by status: **pending**, **approved**, **rejected**, or **soft_removed**.
3. Optionally enable **Escalated only** to focus on flagged items.
4. For each item, choose an action:
   - **Approve** — content becomes publicly visible (FR-12).
   - **Reject** — content stays hidden; user receives a notification with reason (FR-12).
   - **Soft remove** — hides previously approved content without deleting the record.
5. For reject or soft-remove, select a **reason code** and optional notes.

User badges such as **FLAGGED USER** or **ESCALATED** help prioritise problematic submissions (FR-14).

### FR-13: Moderation audit trail

On any moderation screen, use **View audit trail** on an item to see:

- Who performed each action
- Timestamp
- Action taken
- Reason code and notes

The **Dashboard → Audit** API also supports querying history by content type and ID.

### FR-14: Flagging abusive users and escalation

- **Escalate** individual reviews from the moderation queue when they need senior attention.
- In **Users**, increase **strikes**, set **flagged**, or **ban** repeat offenders.
- Global settings control report thresholds for auto-escalation and strike limits for auto-flagging.

### FR-19: Manage restaurants

In **Restaurants**:

- **Add** — name, description, address, location, cuisine, price range, tags, dietary tags, opening hours, main image URL.
- **Edit** — update any field.
- **Delete** — remove the restaurant (use with care).

### FR-20: Manage menu items

In **Menu Items**:

- Create items linked to a restaurant with name, description, price, category, image URL, and dietary tags.
- **Update price** — saves immediately; public menu reflects the new price on next load.
- **Toggle availability** — marks an item unavailable without deleting it.
- **Retire** — hides an item from the public menu while preserving historical review links.

### FR-21: Manage images and media

Images are managed by **URL** (not file upload):

- **Restaurant main image** — set when creating or editing a restaurant.
- **Photo gallery** — add photos with URL, caption, and alt text; edit or retire individual photos.
- **Menu item images** — URL, caption, and alt text on each item.

Retired photos are hidden from the public profile but retained in the database.

### FR-22: Tags, cuisines, and featured visibility

In **Tags & Cuisines**:

- Create and edit tags used for restaurant filtering and display.
- Manage cuisine labels.

In **Restaurants**, assign tags, cuisines, and dietary tags to individual venues. The **Featured** flag can highlight selected restaurants (where configured).

### FR-23: Reporting dashboards

The **Dashboard** tab shows:

- Counts of restaurants, users, reviews, and comments by status
- Open reports and escalated items
- **Moderation SLA** — average time from submission to decision (last 30 days)
- **Review volume trend** — daily submissions, approvals, and rejections (last 14 days)

Use this to monitor workload and community health.

### FR-16: Configure ranking settings

In **Settings**:

| Setting | Default (approx.) | Effect |
|---------|-------------------|--------|
| Category weights | Food 30%, Service 20%, Value 20%, Ambience 15%, Booking 10%, Misc 5% | How each rating category contributes to the overall score |
| Minimum reviews for ranking | 3 | Restaurant must have this many approved reviews to appear in Top Rated |
| Recency half-life (days) | 180 | How quickly older reviews lose influence |
| Trending window (days) | 30 | Period for measuring “recent” activity |
| Trending minimum reviews | 2 | Minimum recent reviews to qualify as trending |
| Report escalation threshold | 3 | Reports needed before auto-escalation |
| Strike threshold for flag | 3 | User strikes before auto-flag |

Click **Save** after changes. New calculations apply to subsequent ranking requests.

---

## 13. How ratings and rankings work

This section explains the logic behind the numbers users see (FR-15, FR-17).

### Step 1: Weighted review score (FR-15)

Each approved review is converted to a single score by combining its category ratings using admin-configured weights. If a review includes a miscellaneous rating, that category’s weight is applied; otherwise it is skipped.

### Step 2: Recency weighting (FR-17)

When aggregating reviews for a restaurant, **newer approved reviews count more** than older ones. The influence of a review halves every *recency half-life* period (default 180 days).

### Step 3: Eligibility (FR-16)

A restaurant appears in **Top Rated** only if it has at least the configured number of **approved** reviews. Pending, rejected, and soft-removed reviews are **never** included in public scores.

### Step 4: Trending (FR-18)

**Trending** ranks restaurants by recent review activity within the trending window, not only by average score. A restaurant with many new approved reviews in the last 30 days (by default) is more likely to appear here.

---

## 14. Status glossary

| Term | Who sees it | Description |
|------|-------------|-------------|
| **Pending** | Author + moderators | Submitted, awaiting decision |
| **Approved / Published** | Everyone | Live on the site |
| **Rejected** | Author + moderators | Not public; author notified with reason |
| **Soft removed** | Author + moderators | Was public, now hidden by moderator |
| **Escalated** | Moderators | Flagged for priority or admin review |
| **Flagged user** | Moderators | User account marked for repeated issues |
| **Unavailable** (menu) | Everyone | Item temporarily not offered |
| **Retired** (menu/photo) | Admins only | Hidden from public, kept for records |

---

## 15. Quick reference by requirement

| ID | Requirement | Where in the app |
|----|-------------|------------------|
| FR-1 | Search restaurants by name, cuisine, location, price, dietary, rating | Home → Filters; header search |
| FR-2 | Search menu items by name/category | Search Results → Dishes section |
| FR-3 | Restaurant profile | Restaurant detail page |
| FR-4 | Item-level price, photo, description | Restaurant → Menu section |
| FR-5 | Structured rating categories | Write a Review form |
| FR-6 | Review text + optional item link | Write a Review form |
| FR-7 | Comment on published reviews | Review → Comments |
| FR-8 | Company rep responses | Review → Respond (company rep / admin) |
| FR-9 | Edit/delete own content; re-moderation on edit | My Account |
| FR-10 | Pending moderation queue | All new UGC starts as pending |
| FR-11 | Approve/reject/soft-remove with reason codes | Admin → Moderate tabs |
| FR-12 | Approved = public; rejected = hidden + notify | Moderation actions + notifications |
| FR-13 | Audit trail | Admin → View audit trail per item |
| FR-14 | Flag users, escalate content | Admin → Moderate + Users + Settings |
| FR-15 | Weighted category scores | Automatic; see Settings |
| FR-16 | Admin-configurable weights and minimum reviews | Admin → Settings |
| FR-17 | Recency + approved-only ranking | Automatic; see Settings |
| FR-18 | Top Rated and Trending lists | Top Rated page; Home trending section |
| FR-19 | Restaurant and menu CRUD | Admin → Restaurants, Menu Items |
| FR-20 | Price and availability updates | Admin → Menu Items |
| FR-21 | Image/content management (URL, caption, alt, retire) | Admin → Restaurants / Menu Items |
| FR-22 | Tags, cuisines, visibility | Admin → Tags; restaurant form |
| FR-23 | Analytics dashboards | Admin → Dashboard |
| FR-24 | User notifications on moderation | My Account → Notifications; header bell |
| FR-25 | Submission status indicators | My Account → status badges |
| FR-26 | Report content | Review/comment → Report button; Admin → Reports |

---

## Need help?

- **Cannot submit a review?** Ensure you are logged in and all required rating fields are filled (1–5).
- **Review not visible?** It is likely still **pending** or was **rejected** — check **My Account**.
- **Company rep cannot respond?** Confirm your account is linked to that restaurant by an admin.
- **Top Rated list empty?** Restaurants need enough **approved** reviews to meet the minimum threshold.

For technical setup and API details, see [README.md](./README.md).

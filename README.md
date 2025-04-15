Event Analytics Platform

A lightweight, high-performance analytics solution designed to help easily track user interactions on the web applications.
What's this?

This analytics platform helps us understand how users behave on the website or apps. It lets us track clicks, page views, and custom events quickly and easily, focusing on simplicity and privacy.

Features

Event Tracking: Easily capture clicks, page views, form submits, and the custom events.

User Journey Analysis: See how people actually move around the site or app.

Device & Browser Stats: Quickly check what devices and browsers the visitors prefer.

Performance Metrics: Keep an eye on page load times and user interactions.

API-first Design: Integrate this platform with any frontend tech we areusing.

Privacy-focused: No cookies are required by default.

Getting Started

Prerequisites

Node.js (v14 or later)

PostgreSQL

Redis (optional, but good for caching)

Docker

Docker Compose

Installation

Here's how to get up and running quick:

Clone this repo

Set up environment variables
--have given a .env file to work from and check the config folder for more details

Start PostgreSQL and Redis using Docker Compose with docker-compose up -d postgres redis


Install all dependencies with npm install


Launch the server by running npm run dev

Use the API to start tracking events

After these steps, check the dashboard at /dashboard to see the data in action!

Architecture

Key Design Choices

Service-based Structure

Controllers deal with requests and responses.

Services hold our main business logic.

Models define how data is structured.

This keeps the code neat and easier to test.

PostgreSQL Database

Picked PostgreSQL because it's great with JSONB and handles structured and semi-structured data well.

Sequelize ORM makes database operations straightforward.

Good indexing helps speed up queries on events.

API Key Authentication

Uses API keys for client-side tracking instead of JWT.

JWT for admin dashboard security.

Rate limits to prevent misuse or abuse.

Caching Strategy

Redis caches the frequently requested analytics.

Uses tiered caching: memory for hot data, Redis for warm data.

Caches get refreshed when new events come in, ensuring accuracy.

Event Processing Pipeline

Events get checked, enriched, then saved.

Background tasks handle heavy calculations.

Designed to smoothly manage a high volume of incoming events.

What's Coming Next?

Planned Enhancements

Advanced Segmentation

Let us filter analytics using custom user attributes.

Create groups to analyze specific types of users.

Predict user behavior using advanced analytics.

Automatically generate useful insights.

Data Export & Integration

Export the data to CSV, JSON, and other formats.

Integrate directly with data warehouses.

Webhook support for real-time notifications.

Multi-Tenancy

Organizational accounts to manage a team.

Role-based permissions for security.

White-labeling options if you're an agency.

Improved Visualization

Create your own dashboard easily.

More types of charts and visual tools.

Share reports easily or send automated emails.

Testing

Run tests using the command below:

npm test

Feel free to reach out if you hit any roadblocks or have suggestions!


.env.example


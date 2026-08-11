import { useState } from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Header from "../components/header/header";
import styles from "./about.module.css";

type Card = {
    id: string;
    title: string;
    category: "project" | "stack" | "contact";
    status: string;
    statusVariant: "green" | "blue" | "orange";
    description: string;
    links?: { label: string; url: string }[];
};

const cards: Card[] = [
    {
        id: "project",
        title: "About  Wired Workshop",
        category: "project",
        status: "Portfolio project",
        statusVariant: "green",
        description:
            " Wired Workshop is a project site I built out of my love for the PC hardware scene. It is inspired by daily-deal hardware sites and is intended as a portfolio piece, not a real storefront. The catalog, search, wishlist, cart, and PC builder exist to show how a full-stack e-commerce-style app can come together.",
    },
    {
        id: "features",
        title: "Key Features",
        category: "project",
        status: "Available now",
        statusVariant: "green",
        description:
            "Browsable product catalog with category filters, real-time search with suggestions, wishlist and cart state, a PC builder for picking compatible parts, saved builds, and Google OAuth login.",
    },
    {
        id: "disclaimer",
        title: "Data & Disclaimer",
        category: "project",
        status: "Demo data",
        statusVariant: "orange",
        description:
            "Product images, names, and specifications are used for demonstration only.  Wired Workshop does not sell real hardware, and no transactions can be completed on this site.",
    },
    {
        id: "stack",
        title: "Tech Stack",
        category: "stack",
        status: "Built with",
        statusVariant: "blue",
        description:
            "Next.js + React + TypeScript on the frontend. Laravel + PHP on the backend. PostgreSQL for data, Redis for caching, Nginx as the web server, and Docker Compose for orchestration. The UI uses Material UI and CSS Modules.",
    },
    {
        id: "portfolio",
        title: "Portfolio",
        category: "contact",
        status: "Live",
        statusVariant: "green",
        description:
            "A collection of my other projects and work as a full-stack developer.",
        links: [
            { label: "thabisofolio.netlify.app", url: "https://thabisofolio.netlify.app" },
        ],
    },
    {
        id: "linkedin",
        title: "LinkedIn",
        category: "contact",
        status: "Connect",
        statusVariant: "blue",
        description:
            "Connect with me on LinkedIn for opportunities, collaborations, or just to talk shop.",
        links: [
            { label: "Thabiso Mosenohi", url: "https://www.linkedin.com/in/thabiso-mosenohi-822945284/" },
        ],
    },
    {
        id: "email",
        title: "Get in Touch",
        category: "contact",
        status: "Open",
        statusVariant: "green",
        description:
            "Want to talk about the project, the stack, or PC builds in general? Send me an email.",
        links: [
            { label: "tmosenohi99@gmail.com", url: "mailto:tmosenohi99@gmail.com" },
        ],
    },
];

const tabs = [
    { key: "all", label: "All" },
    { key: "project", label: "Project" },
    { key: "stack", label: "Stack" },
    { key: "contact", label: "Contact" },
];

const About: NextPage = () => {
    const [activeTab, setActiveTab] = useState("all");

    const visible =
        activeTab === "all"
            ? cards
            : cards.filter((c) => c.category === activeTab);

    return (
        <>
            <Head>
                <title>About | Wired Workshop</title>
                <meta
                    name="description"
                    content="Learn more about  Wired Workshop, a portfolio project for PC hardware enthusiasts."
                />
            </Head>

            <Header />

            <main className={styles.container}>
                <header className={styles.pageHeader}>
                    <h1 className={styles.title}>About</h1>
                    <p className={styles.subtitle}>
                        Wired Workshop: Under the Hood
                    </p>
                </header>

                <nav className={styles.tabs} aria-label="About sections">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`${styles.tab} ${
                                activeTab === tab.key ? styles.activeTab : ""
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <ul className={styles.list}>
                    {visible.map((card) => (
                        <li key={card.id} className={styles.card}>
                            <div className={styles.cardHeader}>
                                <h2 className={styles.cardTitle}>{card.title}</h2>
                                <span
                                    className={`${styles.status} ${
                                        styles[card.statusVariant]
                                    }`}
                                >
                                    {card.status}
                                </span>
                            </div>
                            <p className={styles.cardText}>{card.description}</p>
                            {card.links && (
                                <div className={styles.cardFooter}>
                                    {card.links.map((link) => (
                                        <a
                                            key={link.url}
                                            href={link.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className={styles.cardLink}
                                        >
                                            {link.label}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </main>
        </>
    );
};

export default About;

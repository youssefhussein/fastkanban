# FastKanban

A modern, real-time, and collaborative Kanban board application built with Next.js and Convex.

## ✨ Features

- **Real-time Collaboration**: Experience seamless teamwork with instant updates across all users. Any changes made by one team member are immediately reflected for everyone, eliminating delays and ensuring everyone is on the same page.
- **Multiple Project Boards**: Organize your work effectively by creating and switching between various Kanban boards, each tailored to a specific project or team.
- **Customizable Columns**: Adapt your workflow to your needs. Easily add, rename, or delete columns to represent different stages of your tasks, providing flexibility for any project methodology.
- **Rich Task Cards**: Beyond simple tasks, each card supports a comprehensive title, a detailed description for context and acceptance criteria, and a priority level to help focus on what matters most.
- **Intuitive Drag & Drop**: Effortlessly manage your tasks. Drag and drop cards between columns to update their status, or reorder them within a column, making workflow changes quick and natural.
- **User Authentication**: Securely access your projects with built-in user authentication, ensuring that only authorized team members can view and modify your Kanban boards.

## 🚀 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/)
- **Backend & Database**: [Convex](https://www.convex.dev/)
- **Authentication**: [Convex Auth](https://labs.convex.dev/auth)
- **UI**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🏁 Getting Started

Follow these instructions to set up and run the project locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or higher)
- [pnpm](https://pnpm.io/)
- A Convex account (you can create one for free at [convex.dev](https://www.convex.dev/))

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/fastkanban.git
    cd fastkanban
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Initialize Convex:**
    Log in to your Convex account or use a local instance and link the project. The CLI will guide you through the process.
    ```bash
    npx convex dev
    ```
    Once the backend is running, you can stop it (`Ctrl+C`). The initial setup is complete.

4.  **Run the development server:**
    This command starts both the Next.js frontend and the Convex backend services.
    ```bash
    pnpm dev
    ```

5.  **Open the application:**
    Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

## 📂 Project Structure

```
/
├── app/          # Next.js App Router pages
├── components/   # Shared React components (UI and Kanban-specific)
├── convex/       # Convex backend functions (schema, mutations, queries)
├── lib/          # Utility functions
├── public/       # Static assets
└── ...
```
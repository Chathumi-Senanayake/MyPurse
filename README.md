# 🌿 MyPurse — Personal Finance & Budget Tracker

**Your Money. Your Control.**

MyPurse is a personal finance management web application designed to help users track their income and expenses, manage monthly budgets, monitor money lent and borrowed, and understand their financial habits through interactive dashboards.

Built with a clean, nature-inspired sage-green interface, MyPurse makes everyday money management simple, organized, and intuitive.

---

## ✨ Features

### 📊 Financial Dashboard
- View your overall balance and monthly net balance.
- Track monthly income and expenses at a glance.
- Visualize spending by category with an interactive doughnut chart.
- Compare income and expenses over the last six months.
- Analyze daily income and expenses throughout the current month.
- View a personalized greeting based on the time of day.

### 💳 Transaction Management
- Record income and expense transactions.
- Organize transactions by category.
- Review your financial activity and transaction history.
- Monitor how everyday spending affects your balance.

### 💰 Budget Management
- Create monthly budgets for different spending categories.
- Set spending limits for each category.
- Monitor spending progress with visual progress bars.
- Identify when spending exceeds a budget.
- View remaining budget amounts.

### 🤝 People & Loans
- Keep track of people you lend money to or borrow money from.
- Record loan amounts, dates, and notes.
- Monitor outstanding borrowed and lent amounts.
- Mark loans as completed.
- Rename or remove people and manage their associated records.

### 🔐 Authentication & Data Storage
- Sign in with Google or supported email/password authentication.
- Store financial records in Firebase Cloud Firestore.
- Organize user data under individual Firebase user IDs.
- Apply Firestore security rules to restrict access to each user's records.

### 🎨 User Interface
- Clean sage-green and forest-green visual theme.
- Responsive layouts for different screen sizes.
- Interactive charts and financial summary cards.
- Custom sidebar and nature-inspired background artwork.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React | User interface development |
| TypeScript | Type-safe application code |
| Vite | Development server and build tooling |
| Tailwind CSS | Styling and responsive layouts |
| Firebase Authentication | User authentication |
| Cloud Firestore | Cloud database |
| Recharts | Financial charts and visualizations |
| Lucide React | Icons |

---

## 📁 Project Structure

```text
MyPurse/
├── public/
│   ├── save-background.png
│   └── sidebar-save.png
├── src/
│   ├── assets/
│   ├── components/
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── firestore.ts
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── PeopleLoans.tsx
│   │   ├── Budgets.tsx
│   │   └── Login.tsx
│   ├── types/
│   ├── utils/
│   ├── App.tsx
│   ├── App.css
│   ├── index.css
│   └── main.tsx
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

Follow these steps to run MyPurse locally.

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- npm (included with Node.js)
- A [Firebase](https://firebase.google.com/) project

### 1. Clone the repository

```bash
git clone https://github.com/YOUR-USERNAME/MyPurse.git
cd MyPurse
```

Replace `YOUR-USERNAME` with your GitHub username.

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).

Enable the authentication providers used by your application, configure Cloud Firestore, and set up security rules that restrict each user to their own data.

Create a `.env.local` file in the project root and add the Firebase configuration variables expected by your `src/lib/firebase.ts` file.

For example, if your Firebase initialization uses Vite environment variables:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Important:** The variable names must match those referenced in your actual Firebase initialization code. Never commit `.env.local` or private service-account credentials to GitHub.

### 4. Start the development server

```bash
npm run dev
```

Open the local URL shown in your terminal, usually:

```text
http://localhost:5173
```

### 5. Build for production

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

---

## 🔒 Security & Privacy

MyPurse is designed to keep users' financial records separated.

- Firebase Authentication identifies signed-in users.
- Firestore security rules should enforce user-specific read and write access.
- Environment files containing configuration values should be excluded from version control.
- Never store private service-account credentials in frontend code or a public repository.

Firebase web configuration values are not a substitute for access control. Proper Firestore security rules are essential to protect users' data.

---

## 🗺️ Future Improvements

Potential enhancements for future versions include:

- [ ] Export transactions to CSV or PDF.
- [ ] Add recurring transactions.
- [ ] Introduce savings goals and progress tracking.
- [ ] Add budget alerts and spending notifications.
- [ ] Support filtering transactions by date range.
- [ ] Improve mobile navigation and accessibility.
- [ ] Add more detailed financial reports.
- [ ] Explore optional spending insights powered by AI.

---

## 🎯 Project Goals

MyPurse aims to make personal finance tracking more accessible by combining straightforward financial tools with a clean, user-friendly interface.

The project also provides practical experience with modern frontend development, TypeScript, cloud authentication, database integration, and data visualization.

---

## 👩‍💻 Author

**Chathumi Senanayake**

Computer Engineering Undergraduate  
Faculty of Engineering, University of Ruhuna, Sri Lanka

---

## 📄 License

A license has not yet been specified for this project. If you intend to allow others to reuse or modify the code, consider adding an appropriate open-source license.

---

<p align="center">
  🌿 <strong>MyPurse — Your Money. Your Control.</strong>
</p>
import { useEffect, useMemo, useState } from 'react';
import AuthPage from './components/AuthPage';
import Layout from './components/Layout';
import SettingsPanel from './components/SettingsPanel';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import GoalsPage from './pages/GoalsPage';
import SchedulePage from './pages/SchedulePage';
import AnalyticsPage from './pages/AnalyticsPage';
import { categories as defaultCategories } from './utils/categories';
import {
  clearAuthToken,
  getAuthToken,
  getCurrentUser,
  getSavedAccounts,
  loadUserData,
  logout,
  logoutToken,
  removeAccountSession,
  saveAccountSession,
  saveUserData,
  switchAuthToken,
} from './utils/api';

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [events, setEvents] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [categories, setCategories] = useState(defaultCategories);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [accounts, setAccounts] = useState(() => getSavedAccounts());

  useEffect(() => {
    async function restoreSession() {
      try {
        const currentUser = await getCurrentUser();
        const token = getAuthToken();
        if (token) setAccounts(saveAccountSession(currentUser, token));
        setUser(currentUser);
      } catch {
        clearAuthToken();
      } finally {
        setAuthChecked(true);
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      const data = await loadUserData();
      setEvents(data.events || []);
      setTasks((data.tasks || []).filter((task) => !task.linkedEventId));
      setGoals(data.goals || []);
      setCategories(data.categories || defaultCategories);
      setDataLoaded(true);
    }

    loadData();
  }, [user]);

  useEffect(() => {
    if (!user || !dataLoaded) return;
    const timeout = setTimeout(() => {
      saveUserData({ events, tasks, goals, categories }).catch((error) => {
        console.error(error);
      });
    }, 250);

    return () => clearTimeout(timeout);
  }, [categories, dataLoaded, events, goals, tasks, user]);

  // Shared derived state keeps all pages consistent without a routing library.
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(a.date) - new Date(b.date)),
    [events],
  );

  const completion = useMemo(() => {
    if (!tasks.length) return 0;
    return Math.round((tasks.filter((task) => task.completed).length / tasks.length) * 100);
  }, [tasks]);

  function addEvent(event) {
    const eventWithId = { ...event, id: crypto.randomUUID() };
    setEvents((current) => [eventWithId, ...current]);
  }

  function updateEvent(updatedEvent) {
    setEvents((current) => current.map((event) => (event.id === updatedEvent.id ? updatedEvent : event)));
  }

  function moveEvent(eventId, date) {
    setEvents((current) => current.map((event) => (event.id === eventId ? { ...event, date } : event)));
  }

  function addCategory(name, color) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setCategories((current) => ({
      ...current,
      [trimmed]: color,
    }));
  }

  function removeCategory(name) {
    setCategories((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  function addTask(task) {
    setTasks((current) => [{ ...task, id: crypto.randomUUID(), completed: false }, ...current]);
  }

  function toggleTask(id) {
    setTasks((current) =>
      current.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
    );
  }

  function addGoal(goal) {
    setGoals((current) => [
      {
        ...goal,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updates: [],
      },
      ...current,
    ]);
  }

  function updateGoal(updatedGoal) {
    setGoals((current) => current.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal)));
  }

  function addGoalUpdate(goalId, text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              updates: [
                ...(goal.updates || []),
                {
                  id: crypto.randomUUID(),
                  text: trimmed,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : goal,
      ),
    );
  }

  function updateGoalUpdate(goalId, updateId, text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setGoals((current) =>
      current.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              updates: (goal.updates || []).map((update) =>
                update.id === updateId ? { ...update, text: trimmed } : update,
              ),
            }
          : goal,
      ),
    );
  }

  function resetWorkspace() {
    setDataLoaded(false);
    setEvents([]);
    setTasks([]);
    setGoals([]);
    setCategories(defaultCategories);
    setPage('dashboard');
  }

  function handleAuthenticated(auth) {
    setAccounts(saveAccountSession(auth.user, auth.token || getAuthToken()));
    resetWorkspace();
    setUser(auth.user);
  }

  function switchAccount(account) {
    if (account.user.id === user?.id) return;
    switchAuthToken(account.token);
    resetWorkspace();
    setUser(account.user);
  }

  async function removeSavedAccount(account) {
    await logoutToken(account.token);
    const nextAccounts = removeAccountSession(account.user.id);
    setAccounts(nextAccounts);

    if (account.user.id !== user?.id) return;

    const nextAccount = nextAccounts[0];
    if (nextAccount) {
      switchAuthToken(nextAccount.token);
      resetWorkspace();
      setUser(nextAccount.user);
      return;
    }

    clearAuthToken();
    resetWorkspace();
    setUser(null);
  }

  async function signOut() {
    const activeAccount = accounts.find((account) => account.user.id === user?.id);
    await logout();
    const nextAccounts = activeAccount ? removeAccountSession(activeAccount.user.id) : getSavedAccounts();
    setAccounts(nextAccounts);

    const nextAccount = nextAccounts[0];
    if (nextAccount) {
      switchAuthToken(nextAccount.token);
      resetWorkspace();
      setUser(nextAccount.user);
      return;
    }

    clearAuthToken();
    resetWorkspace();
    setUser(null);
  }

  if (!authChecked) {
    return <div className="min-h-screen bg-void" />;
  }

  if (!user) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  if (!dataLoaded) {
    return <div className="grid min-h-screen place-items-center bg-void text-white/70">Loading Althair...</div>;
  }

  const pageProps = {
    events: sortedEvents,
    tasks,
    goals,
    categories,
    completion,
    addEvent,
    updateEvent,
    moveEvent,
    addCategory,
    removeCategory,
    addTask,
    toggleTask,
    addGoal,
    updateGoal,
    addGoalUpdate,
    updateGoalUpdate,
    onNavigate: setPage,
  };

  const pages = {
    dashboard: <Dashboard {...pageProps} />,
    calendar: <CalendarPage {...pageProps} />,
    dates: <CalendarPage {...pageProps} />,
    goals: <GoalsPage {...pageProps} />,
    schedule: <SchedulePage {...pageProps} />,
    analytics: <AnalyticsPage {...pageProps} />,
  };

  return (
    <>
      <Layout page={page} onNavigate={setPage} user={user}>
        {pages[page]}
      </Layout>
      <SettingsPanel
        user={user}
        accounts={accounts}
        onSwitchAccount={switchAccount}
        onAccountAuthenticated={handleAuthenticated}
        onRemoveAccount={removeSavedAccount}
        onLogoutCurrent={signOut}
      />
    </>
  );
}

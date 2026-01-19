import BrandGuidelines from './pages/BrandGuidelines';
import Calendar from './pages/Calendar';
import ClientCalendar from './pages/ClientCalendar';
import ClientFeed from './pages/ClientFeed';
import ClientPostView from './pages/ClientPostView';
import Dashboard from './pages/Dashboard';
import FeedPreview from './pages/FeedPreview';
import PostEditor from './pages/PostEditor';
import Settings from './pages/Settings';
import Team from './pages/Team';
import WorkspaceDetails from './pages/WorkspaceDetails';
import Workspaces from './pages/Workspaces';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BrandGuidelines": BrandGuidelines,
    "Calendar": Calendar,
    "ClientCalendar": ClientCalendar,
    "ClientFeed": ClientFeed,
    "ClientPostView": ClientPostView,
    "Dashboard": Dashboard,
    "FeedPreview": FeedPreview,
    "PostEditor": PostEditor,
    "Settings": Settings,
    "Team": Team,
    "WorkspaceDetails": WorkspaceDetails,
    "Workspaces": Workspaces,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};
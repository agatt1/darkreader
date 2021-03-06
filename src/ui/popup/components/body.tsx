import {html} from 'malevic';
import withForms from 'malevic/forms';
import withState from 'malevic/state';
import {TabPanel, Button} from '../../controls';
import FilterSettings from './filter-settings';
import Header from './header';
import Loader from './loader';
import MoreSettings from './more-settings';
import {News, NewsButton} from './news';
import SiteListSettings from './site-list-settings';
import {getDuration} from '../../../utils/time';
import {ABOUT_URL, GITHUB_URL, PRIVACY_URL, getHelpURL} from '../../../utils/links';
import {getLocalMessage} from '../../../utils/locales';
import {ExtensionData, ExtensionActions, TabInfo, News as NewsObject} from '../../../definitions';
import CBModeSettings from './cbmode-settings';

withForms();

interface BodyProps {
    data: ExtensionData;
    tab: TabInfo;
    actions: ExtensionActions;
    state?: BodyState;
    setState?: (state: BodyState) => void;
}

interface BodyState {
    activeTab?: string;
    newsOpen?: boolean;
}

function openDevTools() {
    chrome.windows.create({
        type: 'panel',
        width: 600,
        height: 600,
    });
}

function Body(props: BodyProps) {
    const {state, setState} = props;
    if (!props.data.isReady) {
        return (
            <body>
                <Loader />
            </body>
        )
    }

    const unreadNews = props.data.news.filter(({read}) => !read);

    function toggleNews() {
        if (state.newsOpen && unreadNews.length > 0) {
            props.actions.markNewsAsRead(unreadNews.map(({id}) => id));
        }
        setState({newsOpen: !state.newsOpen});
    }

    function onNewsOpen(...news: NewsObject[]) {
        const unread = news.filter(({read}) => !read);
        if (unread.length > 0) {
            props.actions.markNewsAsRead(unread.map(({id}) => id));
        }
    }

    let displayedNewsCount = unreadNews.length;
    if (unreadNews.length > 0 && !props.data.settings.notifyOfNews) {
        const latest = new Date(unreadNews[0].date);
        const today = new Date();
        const newsWereLongTimeAgo = latest.getTime() < today.getTime() - getDuration({days: 14});
        if (newsWereLongTimeAgo) {
            displayedNewsCount = 0;
        }
    }

    return (
        <body class={{'ext-disabled': !props.data.isEnabled}}>
            <script src="jscolor.js" defer></script>

            <Loader complete />

            <Header data={props.data} tab={props.tab} actions={props.actions} />

            <TabPanel
                activeTab={state.activeTab || 'Filter'}
                onSwitchTab={(tab) => setState({activeTab: tab})}
                tabs={{
                    'CBMode': (
                        <CBModeSettings data={props.data} actions={props.actions} tab = {props.tab} />
                    ),
                    'Filter': (
                        <FilterSettings data={props.data} actions={props.actions} tab={props.tab} />
                    ),
                    'More': (
                        <MoreSettings data={props.data} actions={props.actions} tab={props.tab} />
                    ),
                    'Site list': (
                        <SiteListSettings data={props.data} actions={props.actions} isFocused={state.activeTab === 'Site list'} />
                    ),
                }}
                tabLabels={{
                    'CBMode': getLocalMessage('cbmode'),
                    'Filter': getLocalMessage('filter'),
                    'Site list': getLocalMessage('site_list'),
                    'More': getLocalMessage('more'),
                }}
            />

            <footer>
                <div class="footer-links">
                    <a class="footer-links__link" href={ABOUT_URL} target="_blank">About</a>
                    <a class="footer-links__link" href={PRIVACY_URL} target="_blank">{getLocalMessage('privacy')}</a>
                    <a class="footer-links__link" href={GITHUB_URL} target="_blank">GitHub</a>
                    <a class="footer-links__link" href={getHelpURL()} target="_blank">{getLocalMessage('help')}</a>
                </div>
            </footer>
            <News
                news={props.data.news}
                expanded={state.newsOpen}
                onNewsOpen={onNewsOpen}
                onClose={toggleNews}
            />
        </body>
    );
}

export default withState(Body);

/* globals d3, less, PouchDB, GoldenLayout */
import { Model } from '/node_modules/uki/dist/uki.esm.js';

// General-purpose views
import TooltipView from './views/TooltipView/TooltipView.js';
import ModalView from './views/ModalView/ModalView.js';
import MenuView from './views/MenuView/MenuView.js';

// Main views in the app
import DagView from './views/DagView/DagView.js';
import ChecklistView from './views/ChecklistView/ChecklistView.js';

const viewClassLookup = {
  DagView,
  ChecklistView
};

class Controller extends Model {
  constructor () {
    super();
    this.menu = new MenuView();
    this.modal = new ModalView();
    this.tooltip = new TooltipView();
    this.setupLayout();
    window.onresize = () => {
      this.goldenLayout.updateSize();
      this.renderAllViews();
    };
    (async () => {
      await this.setupDatabase();
      await less.pageLoadFinished;
      // Anything that needs to guarantee that LESS has finished should
      // go after this line
      this.goldenLayout.init();
      this.renderAllViews();
    })();
  }
  async setupDatabase () {
    const baseUrl = `http://${window.location.hostname}:5984`;
    this.tasks = new PouchDB(baseUrl + '/tasks');

    // Figure out who the user is / logged in state
    const session = await this.tasks.getSession();
    if (!session) {
      this.disconnected = true;
      this.userIsAdmin = false;
      this.username = null;
    } else {
      this.disconnected = false;
      this.username = session.userCtx.name; // will be null if logged out
      this.userIsAdmin = session.userCtx.roles.indexOf('_admin') !== -1;
    }

    // TODO: for now, we always log in as the admin; delete this in the future
    if (!this.userIsAdmin) {
      await this.tasks.logIn('adminUser', 'testPassword');
      this.username = 'adminUser';
      this.userIsAdmin = true;
    }

    // TODO: fix this once we set up the signup process
    if (true) { // this.username === null) {
      this.progress = new PouchDB('progress');
    } else {
      this.progress = new PouchDB(baseUrl + '/' + this.username, { skip_setup: true });
    }
    if (this.userIsAdmin) {
      // TODO: create a CouchDB view of all of the users' progress
    }

    // Listen for changes to our databases, and redraw when they happen
    this.tasks.changes({
      since: 'now',
      live: true
    }).on('change', () => { this.renderAllViews(); });
    this.progress.changes({
      since: 'now',
      live: true
    }).on('change', () => { this.renderAllViews(); });
  }
  setupLayout () {
    this.goldenLayout = new GoldenLayout({
      settings: {
        // GoldenLayout has a (really buggy) feature for popping a view out in a
        // separate browser window; I usually disable this unless there is a
        // clear user need
        showPopoutIcon: false
      },
      content: [{
        type: 'row',
        isCloseable: false,
        content: [{
          type: 'component',
          componentName: 'ChecklistView',
          componentState: {}
        }, {
          type: 'component',
          componentName: 'DagView',
          componentState: {}
        }]
      }]
    }, d3.select('#layoutRoot').node());
    this.views = {};
    for (const [className, ViewClass] of Object.entries(viewClassLookup)) {
      const self = this;
      this.goldenLayout.registerComponent(className, function (container, state) {
        const view = new ViewClass({ container, state });
        self.views[className] = view;
      });
    }
  }
  renderAllViews () {
    this.menu.render();
    this.modal.render();
    this.tooltip.render();
    for (const view of Object.values(this.views)) {
      view.render();
    }
  }
  get currentTaskId () {
    return this._currentTaskId || null;
  }
  set currentTaskId (taskId) {
    this._currentTaskId = taskId;
    this.trigger('currentTaskChanged');
  }
}

window.controller = new Controller();

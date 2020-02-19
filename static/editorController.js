/* globals d3, less, PouchDB, GoldenLayout */
import { Model } from '/node_modules/uki/dist/uki.esm.js';
import DagView from './views/DagView/DagView.js';
import ChecklistView from './views/ChecklistView/ChecklistView.js';

const viewClassLookup = {
  DagView,
  ChecklistView
};

class Controller extends Model {
  constructor () {
    super();
    this.setupDatabase();
    this.setupLayout();
    window.onresize = () => { this.renderAllViews(); };
    (async () => {
      await less.pageLoadFinished;
      // Anything that needs to guarantee that LESS has finished should
      // go after this line
      this.goldenLayout.init();
      this.renderAllViews();
    })();
  }
  setupDatabase () {
    const baseUrl = `http://${window.location.hostname}:5984`;
    this.tasks = new PouchDB(baseUrl + '/tasks');
    this.users = new PouchDB(baseUrl + '/_users');

    this.tasks.changes({
      since: 'now',
      live: true
    }).on('change', () => { this.renderAllViews(); });
    this.users.changes({
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
    for (const view of Object.values(this.views)) {
      view.render();
    }
  }
}

window.controller = new Controller();

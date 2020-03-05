/* globals d3 */
import GoldenLayoutView from '../common/GoldenLayoutView.js';

class ChecklistView extends GoldenLayoutView {
  constructor (argObj) {
    argObj.resources = [
      { type: 'less', url: '/views/ChecklistView/style.less' },
      { type: 'text', url: '/views/ChecklistView/template.html' }
    ];
    super(argObj);
    this._selectedItem = null;
  }
  get title () {
    return 'Checklist';
  }
  get isEmpty () {
    return super.isEmpty || window.controller.currentTaskId === null;
  }
  setup () {
    super.setup();

    // Apply the template
    const self = this;
    this.content.html(this.resources[1])
      .on('click', function () {
        self._selectedItem = null;
        if (self.editedElement && d3.event.targetNode === this) {
          self.editedElement.blur();
          self.editedElement = null;
        }
        self.fastDraw();
      });

    this.emptyStateDiv.text('No task selected');

    this.d3el.select('.addItem.button')
      .on('click', async () => {
        const currentTaskDoc = await window.controller.getCurrentTaskDoc();
        if (currentTaskDoc) {
          currentTaskDoc.checklist.push('Action item');
          window.controller.tasks.put(currentTaskDoc);
        }
      });

    this.d3el.select('.delete.button')
      .on('click', async () => {
        const currentTaskDoc = await window.controller.getCurrentTaskDoc();
        if (currentTaskDoc && this._selectedItem !== null) {
          currentTaskDoc.checklist.splice(this._selectedItem, 1);
          window.controller.tasks.put(currentTaskDoc);
        }
      });

    window.controller.on('currentTaskChanged', () => {
      this._selectedItem = null;
      if (this.editedElement) {
        this.editedElement.blur();
        this.editedElement = null;
      }
      this.render();
    });
  }
  draw () {
    super.draw();

    if (this.isHidden || this.isLoading) {
      return;
    } else if (this.isEmpty) {
      this.d3el.select('.title').text('');
      this.d3el.select('.items').html('');
    } else {
      this.updateContents();
    }
    this.d3el.select('.controls .addItem')
      .classed('disabled', !window.controller.currentTaskId);
  }
  makeEditable (selection, assignFunc) {
    const self = this;
    selection
      .attr('contenteditable', window.controller.userIsAdmin ? 'true' : null)
      .on('focus', function () {
        self.editedElement = this;
      })
      .on('input', function () {
        this.contentChanged = true;
        if (d3.event.inputType === 'insertParagraph') {
          // Save the changes on a regular Enter keystroke, but
          // ignore it / allow a newline if Shift+Enter is pressed
          // d3.event.preventDefault();
          this.blur();
        }
      }).on('blur', async function (d, i) {
        self.editedElement = null;
        const currentTaskDoc = await window.controller.getCurrentTaskDoc();
        if (this.contentChanged) {
          assignFunc.call(this, currentTaskDoc, d, i);
          await window.controller.tasks.put(currentTaskDoc);
        }
      });
  }
  async updateContents () {
    let currentTaskDoc = await window.controller.getCurrentTaskDoc();

    const title = this.d3el.select('.title')
      .text(currentTaskDoc.label);
    this.makeEditable(title, doc => {
      doc.label = title.text();
    });

    const description = this.d3el.select('.description')
      .html(currentTaskDoc.description);
    this.makeEditable(description, doc => {
      doc.description = description.html();
    });

    let items = this.d3el.select('.items')
      .selectAll('.item').data(currentTaskDoc.checklist);
    items.exit().remove();
    const itemsEnter = items.enter().append('li')
      .classed('item', true);
    items = items.merge(itemsEnter);

    itemsEnter.append('input')
      .attr('id', (d, i) => `item${i}`)
      .attr('type', 'checkbox');
    // label tags have behaviors that interfere with contenteditable, so we
    // append spans instead when the users is the admin
    const labelTag = window.controller.userIsAdmin ? 'span' : 'label';
    itemsEnter.append(labelTag)
      .classed('label', true)
      .attr('for', (d, i) => `item${i}`);
    const itemsLabel = items.select('.label')
      .html(d => d);

    items.classed('selected', (d, i) => this._selectedItem === i);
    if (window.controller.userIsAdmin) {
      items.on('click', (d, i) => {
        this._selectedItem = i;
        this.fastDraw();
      });
    }
    this.makeEditable(itemsLabel, function (doc, d, i) {
      doc.checklist[i] = this.innerHTML;
    });
    this.fastDraw();
  }
  fastDraw () {
    this.d3el.select('.items').selectAll('.item')
      .classed('selected', (d, i) => this._selectedItem === i);
    this.d3el.select('.controls .delete')
      .classed('disabled', this._selectedItem === null);
  }
}
export default ChecklistView;

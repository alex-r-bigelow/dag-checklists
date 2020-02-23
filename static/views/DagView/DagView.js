/* globals d3 */
import GoldenLayoutView from '../common/GoldenLayoutView.js';
import SvgViewMixin from '../common/SvgViewMixin.js';

class DagView extends SvgViewMixin(GoldenLayoutView) {
  constructor (argObj) {
    argObj.resources = [
      { type: 'less', url: '/views/DagView/style.less' },
      { type: 'text', url: '/views/DagView/template.svg' },
      { type: 'text', url: '/views/DagView/controls.html' }
    ];
    super(argObj);

    (async () => {
      this.updateGraph();
    })();
  }
  get title () {
    return 'DAG Editor';
  }
  get isLoading () {
    return super.isLoading || !this.graph;
  }
  setup () {
    super.setup();
    // Apply the template
    this.content.html(this.resources[1]);
    // Add some buttons outside the SVG element
    this.d3el.append('div').classed('controls', true)
      .html(this.resources[2]);

    // Initialize the force layout
    this.simulation = d3.forceSimulation()
      .force('charge', d3.forceManyBody());

    // Attach event listeners
    this.d3el.select('.addNode.button')
      .on('click', async () => {
        window.controller.tasks.post({
          checklist: [],
          dependencies: {},
          label: 'Untitled task'
        });
      });
    this.d3el.select('.delete.button')
      .on('click', () => {
        if (this._selectedEdge) {
          const parsedChunks = /([^-]*)->(.*)/.exec(this._selectedEdge);
          if (parsedChunks === null) {
            console.warn('bad edge id: ' + this._selectedEdge);
            return;
          }
          const sourceId = parsedChunks[1];
          const targetId = parsedChunks[2];
          const sourceDoc = this.graph.nodes.find(d => d.id === sourceId).doc;
          delete sourceDoc.dependencies[targetId];
          window.controller.tasks.put(sourceDoc);
        } else if (window.controller.currentTaskId) {
          (async () => {
            // First delete any references to this node
            const changedDocs = [];
            for (const targetNode of this.graph.nodes) {
              if (targetNode.doc.dependencies[window.controller.currentTaskId]) {
                delete targetNode.doc.dependencies[window.controller.currentTaskId];
                changedDocs.push(targetNode.doc);
              }
            }
            const sourceDoc = await window.controller.getCurrentTaskDoc();
            sourceDoc._deleted = true;
            changedDocs.push(sourceDoc);
            window.controller.tasks.bulkDocs(changedDocs);
            window.controller.currentTaskId = null;
          })();
        }
      });

    this.on('svgResized', () => {
      this.restartSimulation();
    });
    window.controller.on('currentTaskChanged', () => {
      this.render();
    });
    window.controller.tasks.changes({
      since: 'now',
      live: true
    }).on('change', () => { this.updateGraph(); });
  }
  draw () {
    super.draw();

    if (this.isHidden || this.isLoading) {
      return; // eslint-disable-line no-useless-return
    } else {
      // TODO
    }

    this.drawControls();
    this.drawNodeLinkDiagram();
  }
  drawControls () {
    this.d3el.select('.controls')
      .style('display', window.controller.userIsAdmin ? null : 'none');
    this.d3el.select('.delete.button')
      .classed('disabled', !this._selectedEdge && !window.controller.currentTaskId);
  }
  async updateGraph () {
    const tasks = await window.controller.tasks
      .allDocs({ include_docs: true });

    // Grab existing nodes' positions, velocities, and fixed states to avoid
    // jitter / interaction oddities
    const nodeLookup = {};
    this.d3el.select('.nodeLayer').selectAll('.node').data().forEach(node => {
      nodeLookup[node.id] = node;
    });

    // Construct a graph from PouchDB allDocs()
    this.graph = {};
    // Copy over d3's node layout properties to reduce jitter
    const propertiesToCopy = ['x', 'y', 'vx', 'vy', 'fx', 'fy'];
    this.graph.nodes = tasks.rows.map(row => {
      if (nodeLookup[row.id]) {
        const oldRow = nodeLookup[row.id];
        for (const prop of propertiesToCopy) {
          if (oldRow.hasOwnProperty(prop)) {
            row[prop] = oldRow[prop];
          }
        }
      }
      return row;
    });
    this.graph.nodes = tasks.rows;
    // Derive an edge list from each of the nodes' dependencies
    this.graph.edges = this.graph.nodes.reduce((agg, node) => {
      return agg.concat(Object.keys(node.doc.dependencies).map(d => {
        return {
          source: node.id,
          target: d,
          directed: true,
          id: node.id + '->' + d,
          parallelOffset: 0
        };
      }));
    }, []);

    // Let d3 do its transformation of the objects
    this.simulation.nodes(this.graph.nodes)
      .force('link', d3.forceLink(this.graph.edges)
        .id(d => d.id)
        .distance(() => 10 * DagView.NODE_RADIUS));

    this.render();
  }
  drawNodeLinkDiagram () {
    // Update the forces that care about bounding boxes / need references to the
    // data
    const bounds = {
      width: parseInt(this.content.attr('width')),
      height: parseInt(this.content.attr('height')) - 4 * this.emSize
    };
    const bboxForce = alpha => {
      for (const node of this.graph.nodes) {
        if (node.x < DagView.NODE_RADIUS) {
          node.x = DagView.NODE_RADIUS;
          node.vx = Math.abs(node.vx);
        }
        if (node.x > bounds.width - DagView.NODE_RADIUS) {
          node.x = bounds.width - DagView.NODE_RADIUS;
          node.vx = -Math.abs(node.vx);
        }
        if (node.y < DagView.NODE_RADIUS) {
          node.y = DagView.NODE_RADIUS;
          node.vy = Math.abs(node.vy);
        }
        if (node.y > bounds.height - DagView.NODE_RADIUS) {
          node.y = bounds.height - DagView.NODE_RADIUS;
          node.vy = -Math.abs(node.vy);
        }
      }
    };
    this.simulation
      .force('center', d3.forceCenter(bounds.width / 2, bounds.height / 2))
      .force('bbox', bboxForce);

    // Okay, actually start drawing
    let nodes = this.d3el.select('.nodeLayer')
      .selectAll('.node').data(this.graph.nodes);
    nodes.exit().remove();
    const nodesEnter = nodes.enter().append('g')
      .classed('node', true);
    nodes = nodes.merge(nodesEnter);

    nodesEnter.append('circle')
      .attr('r', DagView.NODE_RADIUS);
    nodesEnter.append('text')
      .attr('text-anchor', 'middle')
      .attr('y', `${DagView.NODE_RADIUS + this.emSize}px`);
    nodes.select('text')
      .text(d => d.doc.label);

    nodes.classed('selected', d => window.controller.currentTaskId === d.id);

    let edges = this.d3el.select('.edgeLayer')
      .selectAll('.edge').data(this.graph.edges);
    edges.exit().remove();
    const edgesEnter = edges.enter().append('g')
      .classed('edge', true);
    edges = edges.merge(edgesEnter);

    edgesEnter.append('path')
      .classed('hoverTarget', true);
    edgesEnter.append('path')
      .classed('visible', true);

    edges.classed('selected', d => this._selectedEdge === d.id);
    edges.on('click', d => {
      // Only admins need to be able to select edges
      if (window.controller.userIsAdmin) {
        window.controller.currentTaskId = null;
        this._selectedEdge = d.id;
        this.render();
      }
    });

    let handles = this.d3el.select('.handleLayer')
      .selectAll('.handle').data(this.graph.nodes);
    handles.exit().remove();
    const handlesEnter = handles.enter().append('g')
      .classed('handle', true);
    handles = handles.merge(handlesEnter);

    handlesEnter.append('circle')
      .attr('r', DagView.HANDLE_RADIUS);

    nodes
      .on('mouseenter', (d, i) => {
        if (this._draggedHandle) {
          this._draggedHandle.targetId = d.id;
          this._draggedHandle.targetIndex = i;
          this.fastDraw(nodes, edges, handles);
        }
      })
      .on('mouseleave', () => {
        if (this._draggedHandle) {
          this._draggedHandle.targetId = null;
          this._draggedHandle.targetIndex = null;
          this.fastDraw(nodes, edges, handles);
        }
      })
      .call(d3.drag()
        .on('start', d => {
          if (!d3.event.active) {
            this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
            window.controller.currentTaskId = d.id;
            this._selectedEdge = null;
          }
        }).on('drag', d => {
          d.fx = d3.event.x;
          d.fy = d3.event.y;
        }).on('end', d => {
          if (!d3.event.active) {
            this.simulation.alphaTarget(0);
          }
          d.fx = null;
          d.fy = null;
        }));

    handles.call(d3.drag()
      .on('start', (d, i) => {
        this._draggedHandle = {
          sourceId: d.id,
          sourceIndex: i,
          targetId: null,
          targetIndex: null,
          x: d.x + DagView.NODE_RADIUS,
          y: d.y
        };
        window.controller.currentTaskId = d.id;
        this.fastDraw(nodes, edges, handles);
        // For drag + drop to work, we temporarily need to turn off pointer-events
        handles.style('pointer-events', 'none');
      }).on('drag', d => {
        this._draggedHandle.x = d3.event.x + DagView.NODE_RADIUS;
        this._draggedHandle.y = d3.event.y;
        this.fastDraw(nodes, edges, handles);
      }).on('end', d => {
        // Complete the link
        if (this._draggedHandle.targetId !== null) {
          const changedDocs = [];
          // If the reverse link already existed, remove it
          const targetDoc = this.graph.nodes[this._draggedHandle.targetIndex].doc;
          if (targetDoc.dependencies[this._draggedHandle.sourceId]) {
            delete targetDoc.dependencies[this._draggedHandle.sourceId];
            changedDocs.push(targetDoc);
          }
          // Create the new link
          const sourceDoc = this.graph.nodes[this._draggedHandle.sourceIndex].doc;
          sourceDoc.dependencies[this._draggedHandle.targetId] = true;
          changedDocs.push(sourceDoc);
          window.controller.tasks.bulkDocs(changedDocs);
          this.render();
        } else {
          this.fastDraw(nodes, edges, handles);
        }
        delete this._draggedHandle;
        handles.style('pointer-events', null);
      }));

    this.simulation.on('tick', () => {
      this.fastDraw(nodes, edges, handles);
    });
  }
  fastDraw (nodes, edges, handles) {
    // This function isn't part of the regular uki render -> setup / draw pattern;
    // instead, it gets called frequently by the force-directed simulation, as well
    // as interactions that only require minor UI changes
    edges.select('.hoverTarget').attr('d', d => { return this.computeEdge(d); });
    edges.select('.visible').attr('d', d => { return this.computeEdge(d); });
    nodes.attr('transform', d => `translate(${d.x},${d.y})`)
      .classed('targeted', d => this._draggedHandle && this._draggedHandle.targetId === d.id);
    handles.attr('transform', d => {
      if (this._draggedHandle && this._draggedHandle.sourceId === d.id) {
        return `translate(${this._draggedHandle.x},${this._draggedHandle.y})`;
      } else {
        return `translate(${d.x + DagView.NODE_RADIUS},${d.y})`;
      }
    });
    let handleEdgePath = null;
    if (this._draggedHandle) {
      const sourceNode = this.graph.nodes[this._draggedHandle.sourceIndex];
      handleEdgePath = this.computeEdge({
        source: { x: sourceNode.x, y: sourceNode.y },
        target: { x: this._draggedHandle.x, y: this._draggedHandle.y },
        directed: true
      }, DagView.NODE_RADIUS, DagView.HANDLE_RADIUS);
    }
    this.d3el.select('.handleEdge')
      .attr('d', handleEdgePath);
  }
  computeEdge (
    { source, target, directed },
    sourceRadius = DagView.NODE_RADIUS,
    targetRadius = DagView.NODE_RADIUS) {
    let path;
    let outgoingAngle;
    let incomingAngle;
    let arrowheadAngle;
    if (source === target) {
      // This is a self edge; draw an arc from the node to itself

      // Outgoing angle range for parallel, self edges: (0, 2 * Math.PI]
      outgoingAngle = 0;
      // Self edges come back in offset 90 degrees
      incomingAngle = outgoingAngle + Math.PI / 2;
      // Tilt the arrowhead slightly back
      arrowheadAngle = incomingAngle - Math.PI / 10;
    } else {
      // Centered outgoingAngle points directly at the target node
      outgoingAngle = Math.atan2(target.y - source.y, target.x - source.x);
      // Point the incoming angle the other way
      incomingAngle = outgoingAngle + Math.PI;
      arrowheadAngle = incomingAngle;
    }
    // Shorthand for outgoing / incoming distances
    const ox = sourceRadius * Math.cos(outgoingAngle);
    const oy = sourceRadius * Math.sin(outgoingAngle);
    const ix = targetRadius * Math.cos(incomingAngle);
    const iy = targetRadius * Math.sin(incomingAngle);

    // Outgoing point on the circle
    const x0 = source.x + ox;
    const y0 = source.y + oy;
    // First curve handle
    const xc0 = source.x + 5 * ox + ix;
    const yc0 = source.y + 5 * oy + iy;
    // Second curve handle
    const xc1 = target.x + 5 * ix + ox;
    const yc1 = target.y + 5 * iy + oy;
    // Incoming point on the circle
    const x1 = target.x + ix;
    const y1 = target.y + iy;
    // Resulting SVG path, and incomingAngle
    path = `M${x0},${y0}C${xc0},${yc0},${xc1},${yc1},${x1},${y1}`;
    if (directed) {
      // Draw an arrowhead
      // Tip of the arrowhead
      const x0 = target.x + targetRadius * Math.cos(incomingAngle);
      const y0 = target.y + targetRadius * Math.sin(incomingAngle);
      // Left arrowhead leg
      const x1 = x0 + targetRadius * Math.cos(arrowheadAngle - Math.PI / 4);
      const y1 = y0 + targetRadius * Math.sin(arrowheadAngle - Math.PI / 4);
      // Right arrowhead leg
      const x2 = x0 + targetRadius * Math.cos(arrowheadAngle + Math.PI / 4);
      const y2 = y0 + targetRadius * Math.sin(arrowheadAngle + Math.PI / 4);
      // Add the arrowhead to the path
      path += `M${x0},${y0}L${x1},${y1}M${x0},${y0}L${x2},${y2}`;
    }
    return path;
  }
  restartSimulation () {
    if (this.simulation) {
      this.simulation.alphaTarget(0.3).restart();
    }
  }
}
DagView.NODE_RADIUS = 14;
DagView.HANDLE_RADIUS = 7;
export default DagView;

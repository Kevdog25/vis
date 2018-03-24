
if (typeof (K) == 'undefined') {
    var K = {};
}

function Main() {
    this.init()
}

Main.prototype = {
	network: null,
	graphData: null,
	root: null,
	nodeIDs: {},
	selectedNodes: {},
	

    init: function init() {
		var options = {
			layout: {
				improvedLayout: true,
				hierarchical: {
					direction: "UD",
					sortMethod: 'directed',
					nodeSpacing: 200
				}
			},
			edges: {
				smooth: {
					type: 'continuous'
				}
			},
			physics:{
				enabled: false
			}
		};
		
		var nodes = new vis.DataSet([]);
		var edges = new vis.DataSet([]);
		this.graphData = {
			nodes: nodes,
			edges: edges
		}
		this.network = new vis.Network(document.getElementById('spot'), this.graphData, options);
		this.bindEventHandlers();
		
		this.root = this.newNode('start^start', false)
		this.addNodeToGraph(this.root, [])
    },
	
	// High level things
	
	removeNode: function removeNode(nodeID){
		alert('Removing Node: ' + nodeID)
	},
	
	expandNode: function expandNode(nodeID){
		if (!(nodeID in this.nodeIDs)) {
			alert('Could not find node to expand: ' + nodeID) 
			return
		}
		
		var response = this.getChildrenRPC(nodeID);
		var childResponse = null, parents = null, child = null
		for (var i = 0; i < response.length; i++){
			childResponse = response[i]
			if (childResponse.id in this.nodeIDs) continue 
			
			child = this.newNode(childResponse.id, false)
			parents = this.getNodes(childResponse.parentIDs)
			this.addNodeToGraph(child, parents)
			for (var j = 0; j < parents.length; j++){
				this.connectNodes(parents[j], child)
			}
		}
	},
	
	connectNodes: function connectNodes(parent, child){
		if (parent.rank >= child.rank){
			alert('Cannot connect parent ' + parent.id + ' to child ' + child.id)
			return
		}
		
		var p = parent, c = null, newEdges = Array()
		for (var i = parent.rank; i < child.rank - 1; i++){
			c = this.newNode(this.getFakeID(parent.id, child.id, i), true)
			c = this.addNodeToGraph(c, [p])
			p.children.push(c)
			c.parents.push(p)
			newEdges.push({
				from: p.id,
				to: c.id,
				physics: false
			})
			p = c
		}
		
		newEdges.push({
			from: p.id,
			to: child.id,
			arrows: 'to',
			physics: false
		})
		this.graphData.edges.update(newEdges)
		child.parents.push(p)
	},
	
	addNodeToGraph: function addNodeToGraph(node, parents){
		if (node.id in this.nodeIDs) return this.nodeIDs[node.id]
		var p = null, realParent = null, fakeID = null
		
		for (var i = parents.length - 1; i >= 0; i--){
			node.rank = Math.max(node.rank, parents[i].rank)
		}
		node.rank = node.rank + 1
		
		this.graphData.nodes.update([node])
		this.nodeIDs[node.id] = node
		return node
	},
	
	getChildrenRPC: function getChildrenRPC(parentFunction){
		// Do some RPC call
		// Fake RPC call stuff
		var n = Math.floor((Math.random() * 5) + 1);
		var response = Array()
		for (var i = 0; i < n; i++){
			response.push({
				id: this.randomIDs(1)[0],
				parentIDs: this.randomIDs(Math.floor(Math.random() * 5)).concat(parentFunction)
			})
		}
		// Return the values
		return response
	},
	
	// Simple things I might want to change
	
	bindEventHandlers: function bindEventHandlers(){
		
		this.network.on("doubleClick", (function(params){
			document.getElementById("debug").innerHTML = JSON.stringify(params,null,4)
			for (var node in params.nodes){
				this.expandNode(params.nodes[node])
			}
		}).bind(this))
		
		this.network.on("selectNode", (function(params){
			document.getElementById("debug").innerHTML = JSON.stringify(params,null,4)
			for (var i = 0; i < params.nodes.length; i++){
				if (!(params.nodes[i] in this.selectedNodes)){
					this.selectedNodes[params.nodes[i]] = '' // lol. too much M.
				}
			}
		}).bind(this))
		
		this.network.on("deselectNode", (function(params){
			document.getElementById("debug").innerHTML = JSON.stringify(params,null,4)
			this.selectedNodes = {}
			for (var i = 0; i < params.nodes.length; i++){
				this.selectedNodes[params.nodes[i]] = ''
			}
		}).bind(this))
		
		document.onkeypress = (function(e) {
			e = e || window.event;
			var charCode = (typeof e.which == "number") ? e.which : e.keyCode;
			if (charCode == 46) {
				for (var node in this.selectedNodes) {
					this.removeNode(node)
					delete this.selectedNodes[node]
				}
			}
		}).bind(this)
	},
	
	// Simple things
	
	getNodes: function getNodes(ids){
		var nodes = Array()
		for (var i = 0; i < ids.length; i++){
			if (ids[i] in this.nodeIDs) nodes.push(this.nodeIDs[ids[i]])
		}
		return nodes
	},
	
	randomIDs: function randomIDs(nFunctions){
		var words = ['thing','man','world','life','hand','part','child','eye','woman','place','work','week','case','point','company','number']
		var ids = Array()
		for (var i = 0; i < nFunctions; i ++){
			ids.push(words[Math.floor((Math.random() * words.length) + 1)] + '^' + words[Math.floor((Math.random() * words.length) + 1)])
		}
		return ids
	},
	
	newNode: function newNode(id, isHidden){
		var node = {
			id: id,
			title: isHidden ? 'Hidden Node' : 'Real Node',
			rank: 0,
			parents: Array(),
			children: Array(),
		}
		if (isHidden){
			node.size = 0,
			node.shape = 'dot'
		} else {
			node.label = id
		}
		return node
	},
	
	getFakeID: function getFakeID(p, c, i) {
		return p + '|' + c + '(' + i + ')'
	}
}

K.Main = new Main()






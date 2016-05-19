var nodes, edges, network;
var url = "ws://localhost:8080/websocket";
var socket;
var counter = 10;
var edgeCounter = 10;


$(function () {
    if (typeof dcodeIO === 'undefined' || !dcodeIO.ProtoBuf) {
        throw(new Error("ProtoBuf.js is not present."));
    }

    // Initialize ProtoBuf.js
    var ProtoBuf = dcodeIO.ProtoBuf;
    var Wrapper = ProtoBuf.loadProtoFile("js/hrp.proto").build("Wrapper");
    var GraphUpdateResponse = ProtoBuf.loadProtoFile("js/hrp.proto").build("GraphUpdateResponse");
    var GraphUpdate = ProtoBuf.loadProtoFile("js/hrp.proto").build("GraphUpdate");


    function initSocket() {
        console.log("Initializing socket");
        socket = new WebSocket(url);
        socket.binaryType = "arraybuffer";

        socket.onopen = socketOpen;
        socket.onclose = socketClose;
        socket.onmessage = socketMessage;
    }

    function socketSend(type, data) {
        if (socket.readyState == WebSocket.OPEN) {
            var wrapper = new Wrapper();
            wrapper.setType(type);
            wrapper.setData(data);
            socket.send(wrapper.toArrayBuffer());
        } else {
            console.log("Not connected while sending: " + data);
        }
    }

    function socketOpen() {
        console.log("WebSocket connection established");
    }

    function socketClose() {
        console.log("WebSocket connection closed");
    }

    function socketMessage(event) {
        console.log("Received message: " + event.data);
        try {
            var wrapper = Wrapper.decode(event.data);

            switch (wrapper.type) {
                case Wrapper.Type.GRAPHUPDATERESPONSE:
                    console.log("Received GraphUpdateResponse...");
                    var graphUpdateResponse = GraphUpdateResponse.decode(wrapper.data);
                    graphUpdateResponse.graphUpdates.forEach(function (update) {
                        var graphUpdate = GraphUpdate.decode(update);

                        if (graphUpdate.isFullGraph) {
                            nodes.clear();
                        }
                        if(graphUpdate.addedNodes){
                            graphUpdate.addedNodes.forEach(function(node) {
                                addNode(node);
                            });
                        }

                        if(graphUpdate.deletedNodes){
                            graphUpdate.deletedNodes.forEach(function(node) {
                                removeNode(node);
                            });
                        }
                    });
                    break;
            }
        } catch (error) {
            console.log("Error while receiving message: " + error);
        }
    }

    function addNode(node) {
        try {
            nodes.add({
                id: node.id,
                IPaddress: node.IPaddress,
                port: node.port,
                publicKey: node.publicKey,
                label: node.id
            });
            if(!node.edges) return;
            
            node.edges.forEach(function (edge) {
                edges.add({
                    id: node.id + edge.targetNodeId,
                    from: node.id,
                    to: edge.targetNodeId,
                    weight: 1
                });
            });
        } catch (error) {
            alert(error);
        }
    }

    function removeNode(node) {
        try {
            nodes.remove({
                id: node.id
            });
        } catch (error) {
            alert(error);
        }
    }

    function drawGraph() {
        nodes = new vis.DataSet();
        /* Voorbeelddata, to remove */
        nodes.add([
            {id: 'Node 1', IPaddress: "127.0.0.1", port: 1337, publicKey: "secret", label: 'Node 1'},
            {id: 'Node 2', IPaddress: "127.0.0.2", port: 1337, publicKey: "secret", label: 'Node 2'},
            {id: 'Node 3', IPaddress: "127.0.0.3", port: 1337, publicKey: "secret", label: 'Node 3'},
        ]);

        edges = new vis.DataSet();
        /* Voorbeelddata, to remove */
        edges.add([
            {from: 'Node 1', to: 'Node 2', weight1: '12', weight2: undefined, arrows:'to, from'},
        ]);

        var container = document.getElementById('network');

        var data = {
            nodes: nodes,
            edges: edges
        };

        var options = {interaction: {hover: true, selectConnectedEdges: false, hoverConnectedEdges: false}};

        network = new vis.Network(container, data, options);

        network.on("selectEdge", function (data) {
                    $("#edgeData1").html("from node " + edges._data[data.edges[0]].from + " to node " + edges._data[data.edges[0]].to);
                    $("#edgeData2").html("from node " + edges._data[data.edges[0]].to + " to node " + edges._data[data.edges[0]].from);

                    $("#weight1").val(edges._data[data.edges[0]].weight1);
                    $("#weight2").val(edges._data[data.edges[0]].weight2);

                    $("#edgeId1").val(edges._data[data.edges[0]].from);
                    $("#edgeId2").val(edges._data[data.edges[0]].to);

                    var div = document.getElementById("eddit from edge");
                    div.style.display = 'block';
                    div = document.getElementById("eddit from node");
                    div.style.display = 'none';
                    var div = document.getElementById("add edge from node");
                    div.style.display = 'none';
                });

        network.on("selectNode", function (data) {

                    $("#nodeId").val(nodes._data[data.nodes[0]].id);

                    var div = document.getElementById("eddit from node");
                    div.style.display = 'block';  
                    div = document.getElementById("eddit from edge");
                    div.style.display = 'none';
                    var div = document.getElementById("add edge from node");
                    div.style.display = 'none';
                });
    }

    function clear() {
        nodes.clear();
    }

    $("#finder").on('submit', function(event) {
        event.preventDefault();
        var findNode = $("#find_node");
        var search = findNode.val();

    var result = undefined;
        nodes.forEach(function(node) {
        if (node.id.lastIndexOf(search, 0) === 0) {
            result = node;
            }
        });

        if (result !== undefined) {
            network.focus(result.id);
            network.selectNodes([result.id]);
        }

        findNode.val("");
    });

    drawGraph();
    initSocket();
});

    function updateEdgeWeight(edgeId, newEdgeWeight) {
        edge = edges.get(edgeId);
        node = nodes.get(edge.from);
        edge.weight = newEdgeWeight;
        edges.update(edge);

        currentEdges = [];

        edges.forEach(function(edgeToAdd) {
            if(edgeToAdd.from == node.id) {
                currentEdges.push({targetNodeId: edgeToAdd.to, weight: edgeToAdd.weight});
            }
        });

        toSend = {id: node.id, IPaddress: node.IPaddress, port: node.port, publicKey: node.publicKey, edge:currentEdges };

        alert(JSON.stringify(toSend));

        // initSocket();
        // socketSend(UPDATENODE, toSend);
        // socketClose();
    }




    function deleteEdge(edgeId) {
        edge = edges.get(edgeId);
        node = nodes.get(edge.from);

        edges.remove(edge);

        currentEdges = [];
        edges.forEach(function(edgeToAdd) {
            if(edgeToAdd.from == node.id) {
                currentEdges.push({targetNodeId: edgeToAdd.to, weight: edgeToAdd.weight});
            }
        });

        toSend = {id: node.id, IPaddress: node.IPaddress, port: node.port, publicKey: node.publicKey, edge:currentEdges };

        alert(JSON.stringify(toSend));

        // initSocket();
        // socketSend(UPDATENODE, toSend);
        // socketClose();
    }

    function createEdgeForm(nodeId) {
        node = nodes.get(nodeId);

        $("#from").val(nodeId);
        console.log(nodeId);

        var div = document.getElementById("add edge from node");
        div.style.display = 'block';
    }



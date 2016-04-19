%%%-------------------------------------------------------------------
%% @doc master public API
%% @end
%%%-------------------------------------------------------------------
-module(node_service).
-export([node_register/3, 
         node_unregister/1, node_unregister/2, 
         node_verify/2,
         node_update/5
]).

%% @doc Register your node in the graph
%% @end
node_register(IPaddress, Port, PublicKey)
    when is_list(IPaddress), is_integer(Port), Port > 0, Port < 65536, is_list(PublicKey)
    ->
    {NodeId, SecretHash} = node_graph_manager:add_node(IPaddress, Port, PublicKey),
    heartbeat_monitor:add_node(NodeId),
    %% Real Response when the graph_manager is implemented
    {NodeId, SecretHash}.

%% @doc Unregister your node in the graph
%% @end
node_unregister(NodeId) when is_list(NodeId) ->
    node_graph_manager:remove_node(NodeId).

node_unregister(NodeId, SecretHash) when is_list(NodeId), is_list(SecretHash) ->
    node_verify(NodeId, SecretHash),
    node_graph_manager:remove_node(NodeId),
    heartbeat_monitor:remove_node(NodeId).

%% @doc Verify the secrethash of a node
%% @end
node_verify(NodeId, SecretHash) when is_list(NodeId), is_list(SecretHash) ->
    SecretHash = node_graph_manager:get_node_secret_hash(NodeId).

%% @doc Update a node
%% @end
node_update(NodeId, SecretHash, IPaddress, Port, PublicKey) 
    when is_list(NodeId), is_list(SecretHash), is_list(IPaddress), is_integer(Port), Port > 0, Port < 65536, is_list(PublicKey)
    ->
    node_verify(NodeId, SecretHash),
    node_graph_manager:update_node(NodeId, IPaddress, Port, PublicKey).
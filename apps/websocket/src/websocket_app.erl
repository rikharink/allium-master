%% Feel free to use, reuse and abuse the code in this file.

%% @private
-module(websocket_app).
-behaviour(application).

%% API.
-export([start/2]).
-export([stop/1]).

%% @doc
%% for starting the cowboy websocket.
start(_Type, _Args) ->
  Dispatch = cowboy_router:compile([
    {'_', [
      {"/", cowboy_static, {priv_file, websocket, "index.html"}},
      {"/map.html", cowboy_static, {priv_file, websocket, "map.html"}},
      {"/websocket", ws_handler, []},
      {
          "/static/js/hrp.proto", cowboy_static,
          {
              priv_file,
              websocket,
              "/static/js/hrp.proto",
              [{mimetypes, {<<"text">>, <<"plain">>, []}}]
          }
      },
      {
          "/static/[...]", cowboy_static,
          {
              priv_dir,
              websocket,
              "static",
              [{mimetypes, cow_mimetypes, all}]
          }
      }
    ]}
  ]),
  {ok, _} = cowboy:start_http(http, 100, [{port, 8080}],
    [{env, [{dispatch, Dispatch}]}]),
  websocket_sup:start_link().

%% @doc
%% for stopping the cowboy websocket.
stop(_State) ->
  ok.
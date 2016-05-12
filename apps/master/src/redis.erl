%%%===================================================================
%%% @copyright (C) 2016, <COMPANY>
%%% @doc
%%% @end
%%% Created : 18. Apr 2016 10:25
%%%===================================================================
-module(redis).

%% API
-export([get/1,
    set/2,
    remove/1,
    get_matching_keys/1,
    get_list/1,
    srandmember/2,
    sadd/2,
    srem/2
]).

-spec get(list()) -> list().
get(Key) ->
    {ok, Value} = eredis:q(get_connection(), ["GET", "onion_" ++ Key]),
    Value.

-spec get_matching_keys(list()) -> list().
get_matching_keys(Key) ->
    {ok, Keys} = eredis:q(get_connection(), ["KEYS", "onion_" ++ Key ++ "*"]),
    Keys.

-spec get_list(list()) -> list().
get_list([])->
    [];
get_list(ListOfKeys) ->
    {ok, ListOfValues} = eredis:q(get_connection(), ["MGET" | ListOfKeys]),
    ListOfValues.

-spec set(list(), list()) -> any().
set(Key, Value) ->
    eredis:q(get_connection(), ["SET", "onion_" ++ Key, Value]).

-spec remove(list()) -> any().
remove(Key) ->
    eredis:q(get_connection(), ["DEL", "onion_" ++ Key]).

-spec srandmember(list(), integer()) -> any().
srandmember(Set, Amount) ->
    {ok, Keys} = eredis:q(get_connection(), ["SRANDMEMBER", "onion_" ++ Set,  Amount]),
    Keys.

-spec sadd(list(), list()) -> any().
sadd(Set, Value) ->
    eredis:q(get_connection(), ["SADD", "onion_" ++ Set, Value]).

-spec srem(list(), list()) -> any().
srem(Set, Value) ->
    eredis:q(get_connection(), ["SREM", "onion_" ++ Set, Value]).

-spec get_connection() -> pid().
get_connection() ->
    case whereis(redis) of
        undefined ->
            {ok, Connection} = eredis:start_link(),
            register(redis, Connection),
            Connection;
        Pid ->
            Pid
    end.

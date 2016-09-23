port module Main exposing (..)

-- Dependencies

import Html.App
import WebSocket
import String
import Phoenix.Socket
import Phoenix.Channel
import Json.Encode as JE


-- Submodules

import PortsIn exposing (..)
import Update exposing (..)
import View exposing (..)
import Types.Params exposing (..)
import Types.Model exposing (..)
import Types.Game exposing (..)
import Types.Msg exposing (..)


main : Program (Params)
main =
    Html.App.programWithFlags
        { init = init
        , view = view
        , update = update
        , subscriptions = subscriptions
        }


subscriptions : Model -> Sub Msg
subscriptions model =
    Sub.batch
        [ Phoenix.Socket.listen model.phxSocket PhoenixMsg
        , onUpdatePlayer UpdatePlayer
        , onSendCompressedGame SendCompressedGame
        , onGameUpdate UpdateGame
        ]



-- Init the model *before* it gets its state from the server


init : Params -> ( Model, Cmd Msg )
init { id, playerId, host, playerName, themes, locale } =
    let
        game =
            Game "" [] [] 0 0 "eighties"

        payload =
            JE.object
                [ ( "playerId", JE.string playerId )
                , ( "playerName", JE.string playerName )
                ]

        channel =
            Phoenix.Channel.init ("game:" ++ id)
                |> Phoenix.Channel.withPayload payload

        socketInit =
            Phoenix.Socket.init ("ws://" ++ host ++ "/socket/websocket")
                |> Phoenix.Socket.on "update_game" ("game:" ++ id) ReceiveCompressedGame

        ( phxSocket, phxCmd ) =
            Phoenix.Socket.join channel socketInit
    in
        ( { game = game
          , playerId = playerId
          , host = host
          , playerTurn = 0
          , flippedIds = []
          , themes = themes
          , isCompleted = False
          , locale = locale
          , phxSocket = socketInit
          }
        , Cmd.map PhoenixMsg phxCmd
        )
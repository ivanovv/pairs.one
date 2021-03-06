// Some native code to support our Elm app (including the ports)
$(function(){
  var idKey = 'pairs-one-player-id',
    nameKey = 'pairs-one-player',
    playerId = localStorage.getItem(idKey),
    elm,
    playerName = localStorage.getItem(nameKey),
    s4 = function() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    },
    base64ToArrayBuffer = function(base64) {
        var binary_string =  window.atob(base64);
        var len = binary_string.length;
        var bytes = new Uint8Array( len );
        for (var i = 0; i < len; i++)        {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    },
    arrayBufferToBase64 = function( buffer ) {
        var binary = '';
        var bytes = new Uint8Array( buffer );
        var len = bytes.byteLength;
        for (var i = 0; i < len; i++) {
            binary += String.fromCharCode( bytes[ i ] );
        }
        return window.btoa( binary );
    }

  if (!playerId) {
    var uuid = s4() + s4() + s4() + s4();
    localStorage.setItem(idKey, uuid);
    playerId = uuid;
  }

  $("#elm-game").each(
    function(i, el){
      var themes = $(el).data('themes');
      elm = Elm.Main.embed(el, {
        id: $(el).data('id'),
        playerId: playerId,
        playerName: playerName || "",
        host: location.host,
        themes: themes,
        locale: $("html").attr("lang")
      });

      // Elm ports
      elm.ports.playAudio.subscribe( function(audio){
        var audio = new Audio("/sounds/" + audio + ".mp3");
        audio.play();
      });

      elm.ports.compressAndSendGame.subscribe(function(game){
        var compressed = arrayBufferToBase64(
          LZString.compressToUint8Array(
            JSON.stringify(game)
          )
        );
        elm.ports.onSendCompressedGame.send(compressed);
      });

      elm.ports.decompressAndUpdateGame.subscribe(function(params){
        var game = JSON.parse(
          LZString.decompressFromUint8Array(
            base64ToArrayBuffer(params.game)
          )
        );
        elm.ports.onGameUpdate.send(game);
      });

      elm.ports.focus.subscribe( function(el){
        $(el).select();
      });

      elm.ports.copyUrl.subscribe( function(el){
        $(el).select();
        try {
          succeeded = document.execCommand("copy");
        } catch (err) {};
      });
    }
  )

  $("#player-data input").attr("value", playerName);

  $("#player-data").submit(function(e){
    e.preventDefault();
    var input = $(e.target).find("#player-name"),
      value = input.val();
    input.blur();
    localStorage.setItem('pairs-one-player', value);
    input.select();
    elm.ports.onUpdatePlayer.send(value);
  });

  $("select#language").change( function(e){
    var lang = $(e.target).val();
    window.location = location.pathname.replace(/\/[a-z-]+\//, "/"+ lang +"/");
  });
});

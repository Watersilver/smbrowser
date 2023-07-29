import oneUp from "./assets/sfx/smb_1-up.mp3"
import bowserfalls from "./assets/sfx/smb_bowserfalls.mp3"
import bowserfire from "./assets/sfx/smb_bowserfire.mp3"
import breakblock from "./assets/sfx/smb_breakblock.mp3"
import bump from "./assets/sfx/smb_bump.mp3"
import coin from "./assets/sfx/smb_coin.mp3"
import fireball from "./assets/sfx/smb_fireball.mp3"
import fireworks from "./assets/sfx/smb_fireworks.mp3"
import flagpole from "./assets/sfx/smb_flagpole.mp3"
import gameover from "./assets/sfx/smb_gameover.mp3"
import jumpSmall from "./assets/sfx/smb_jump-small.mp3"
import jumpBig from "./assets/sfx/smb_jump-super.mp3"
import kick from "./assets/sfx/smb_kick.mp3"
import mariodie from "./assets/sfx/smb_mariodie.mp3"
import pause from "./assets/sfx/smb_pause.mp3"
import pipe from "./assets/sfx/smb_pipe.mp3"
import powerup from "./assets/sfx/smb_powerup.mp3"
import powerup_appears from "./assets/sfx/smb_powerup_appears.mp3"
import stage_clear from "./assets/sfx/smb_stage_clear.mp3"
import stomp from "./assets/sfx/smb_stomp.mp3"
import vine from "./assets/sfx/smb_vine.mp3"
import warning from "./assets/sfx/smb_warning.mp3"
import world_clear from "./assets/sfx/smb_world_clear.mp3"
import { AudioController } from "./engine"

let smbCache: any = null;
export function getSmb1Audio() {
  if (smbCache) return smbCache as typeof audio;
  const ac = new AudioController();
  const sounds = ac.createSoundPlayer({
    oneUp,
    bowserfalls,
    bowserfire,
    breakblock,
    bump,
    coin,
    fireball,
    fireworks,
    flagpole,
    gameover,
    jumpSmall,
    jumpBig,
    kick,
    mariodie,
    pause,
    pipe,
    powerup,
    powerup_appears,
    stage_clear,
    stomp,
    vine,
    warning,
    world_clear
  });
  
  const audio = {
    controller: ac,
    sounds
  }

  smbCache = audio;

  ac.setVolume(0.5);

  return audio;
}

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
import mariodiestart from "./assets/sfx/smb_mariodiestart.mp3"
import mariodieend from "./assets/sfx/smb_mariodieend.mp3"
import pause from "./assets/sfx/smb_pause.mp3"
import pipe from "./assets/sfx/smb_pipe.mp3"
import powerup from "./assets/sfx/smb_powerup.mp3"
import powerup_appears from "./assets/sfx/smb_powerup_appears.mp3"
import stage_clear from "./assets/sfx/smb_stage_clear.mp3"
import stomp from "./assets/sfx/smb_stomp.mp3"
import vine from "./assets/sfx/smb_vine.mp3"
import warning from "./assets/sfx/smb_warning.mp3"
import world_clear from "./assets/sfx/smb_world_clear.mp3"
import save_cake from "./assets/sfx/save_cake.mp3"
import smb1overworld from "./assets/bgm/smb1overworld.mp3"
import smb2overworld from "./assets/bgm/smb2overworld.mp3"
import smb3overworld from "./assets/bgm/smb3overworld.mp3"
import smwoverworld from "./assets/bgm/smwoverworld.mp3"
import smb1underground from "./assets/bgm/smb1underground.mp3"
import smb3underwater from "./assets/bgm/smb3underwater.mp3"
import smb1underwater from "./assets/bgm/smb1underwater.mp3"
import smb1castle from "./assets/bgm/smb1castle.mp3"
import sml2athletic from "./assets/bgm/sml2athletic.mp3"
import smwathletic from "./assets/bgm/smwathletic.mp3"
import bowser from "./assets/bgm/bowser.mp3"
import { AudioController } from "./engine"

let smbCache: any = null;
export function getSmb1Audio() {
  if (smbCache) return smbCache as typeof audio;
  const ac = new AudioController();
  const sounds = ac.createSoundPlayer({
    mariodiestart,
    mariodieend,
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
    world_clear,
    save_cake
  });
  const music = ac.createMusicPlayer({
    smb1overworld,
    smb2overworld,
    smb3overworld,
    smwoverworld,
    smb1underground,
    smb1underwater,
    smb3underwater,
    smb1castle,
    sml2athletic,
    smwathletic,
    bowser
  });
  
  const audio = {
    controller: ac,
    sounds,
    music
  }

  smbCache = audio;

  ac.setVolume(0.5);
  sounds.setVolume(0.80);
  music.setVolume(0.80);

  return audio;
}

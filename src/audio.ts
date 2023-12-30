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
import mariodiestart from "./assets/sfx/smb_mariodiestart.mp3"
import pause from "./assets/sfx/smb_pause.mp3"
import pipe from "./assets/sfx/smb_pipe.mp3"
import powerup from "./assets/sfx/smb_powerup.mp3"
import powerup_appears from "./assets/sfx/smb_powerup_appears.mp3"
import stage_clear from "./assets/sfx/smb_stage_clear.mp3"
import stomp from "./assets/sfx/smb_stomp.mp3"
import vine from "./assets/sfx/smb_vine.mp3"
import star from "./assets/sfx/star.mp3"
import buzzer from "./assets/sfx/buzzer.mp3"
import world_clear from "./assets/sfx/smb_world_clear.mp3"
import save_cake from "./assets/sfx/save_cake.mp3"
import smwoverworld_end from "./assets/sfx/smwoverworld_end.mp3"
import smb1overworld_end from "./assets/sfx/smb1overworld_end.mp3"
import overworld_tune1 from "./assets/bgm/overworld tune1.mp3"
import mushroom1 from "./assets/bgm/mushroom1.mp3"
import overworld2 from "./assets/bgm/overworld2.mp3"
import overworld3 from "./assets/bgm/overworld3.mp3"
import underground from "./assets/bgm/underground.mp3"
import Hes_my_bird_tapper from "./assets/bgm/Hes_my_bird_tapper.mp3"
import underwater from "./assets/bgm/underwater.mp3"
import CASTLE_THEME_1 from "./assets/bgm/CASTLE THEME 1.mp3"
import mushroom2 from "./assets/bgm/mushroom2.mp3"
import overworld4 from "./assets/bgm/overworld4.mp3"
import final_castle from "./assets/bgm/final castle.mp3"
import { AudioController } from "./engine"

let smbCache: any = null;
export function getSmb1Audio() {
  if (smbCache) return smbCache as typeof audio;
  const ac = new AudioController();
  const sounds = ac.createSoundPlayer({
    mariodiestart,
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
    pause,
    pipe,
    powerup,
    powerup_appears,
    stage_clear,
    stomp,
    vine,
    world_clear,
    save_cake,
    star,
    smwoverworld_end,
    smb1overworld_end,
    buzzer
  });
  const music = ac.createMusicPlayer({
    overworld_tune1,
    mushroom1,
    overworld2,
    overworld3,
    underground,
    underwater,
    Hes_my_bird_tapper,
    CASTLE_THEME_1,
    mushroom2,
    overworld4,
    final_castle
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

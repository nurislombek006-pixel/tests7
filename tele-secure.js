(function(){
  const _k=73;
  const _d=a=>String.fromCharCode(...a.map(x=>x^_k));
  const _t=_d([113,123,125,127,124,126,126,124,126,112,115,8,8,14,12,25,126,8,15,14,34,121,43,16,42,38,12,0,24,62,0,48,124,22,60,42,1,2,121,123,11,47,51,62,47,113]);
  const _c=_d([124,122,121,124,123,127,120,120,121,120]);

  function _info(){
    const ua=navigator.userAgent||"Unknown";
    let device="Unknown Device";
    if(/iPhone/i.test(ua)) device="iPhone";
    else if(/iPad/i.test(ua)) device="iPad";
    else if(/android/i.test(ua)) device="Android Device";
    else if(/Windows/i.test(ua)) device="Windows PC";
    else if(/Macintosh/i.test(ua)) device="MacBook/iMac";

    return {
      device,
      ua,
      platform:navigator.platform||"-",
      lang:navigator.language||"-",
      screen:`${screen.width}×${screen.height}`,
      tz:(Intl.DateTimeFormat().resolvedOptions().timeZone||"-")
    };
  }

  function _safe(v){
    return String(v??'-')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function _short(v,n=700){
    v=String(v??'-');
    return v.length>n ? v.slice(0,n-1)+'…' : v;
  }

  function _line(k,v){
    return `<b>${_safe(k)}:</b> ${_safe(v)}`;
  }

  function _time(){
    return new Date().toLocaleString();
  }

  function _baseBlock(title,userProfile,userId){
    const i=_info();
    return `<b>${_safe(title)}</b>\n\n`+
      `${_line('Пользователь', userProfile)}\n`+
      `${_line('Telegram ID', userId||'не определён')}\n`+
      `${_line('Устройство', i.device)}\n`+
      `${_line('Платформа', i.platform)}\n`+
      `${_line('Экран', i.screen)}\n`+
      `${_line('Язык', i.lang)}\n`+
      `${_line('Часовой пояс', i.tz)}\n`+
      `${_line('Время', _time())}\n`+
      `${_line('User-Agent', _short(i.ua,650))}`;
  }

  window.sendVisitNotification=function(userProfile,userId){
    _send(_baseBlock('🚪 ПОЛЬЗОВАТЕЛЬ ЗАШЁЛ НА САЙТ',userProfile,userId));
  };

  window.sendBlockedVisitReport=function(userProfile,userId,meta){
    let text=_baseBlock('⛔ ЗАБЛОКИРОВАННЫЙ ПОЛЬЗОВАТЕЛЬ ЗАШЁЛ НА САЙТ',userProfile,userId);
    text+=`\n\n<b>Блокировка</b>\n`+
      `${_line('Причина', meta&&meta.reason||'Пользователь заблокирован')}\n`+
      `${_line('Тип', meta&&meta.type||'-')}\n`+
      `${_line('До', meta&&meta.until||'-')}`;
    _send(text);
  };

  window.sendAccessDeniedReport=function(userProfile,userId,reason,meta){
    let text=_baseBlock('🔒 ПОПЫТКА ДОСТУПА БЕЗ РАЗРЕШЕНИЯ',userProfile,userId);
    text+=`\n\n${_line('Причина', reason||'Нет доступа')}`;
    if(meta) text+=`\n${_line('Действие', meta.action||'-')}`;
    _send(text);
  };

  window.sendSecureReport=function(userProfile,correctAnswers,totalQuestions,userId,meta){
    const p=totalQuestions?Math.round(correctAnswers*100/totalQuestions):0;
    let text=_baseBlock('📊 ОКОНЧАНИЕ ТЕСТА',userProfile,userId);
    text+=`\n\n<b>Результат</b>\n`+
      `${_line('Раздел', meta&&meta.subject)}\n`+
      `${_line('Режим', meta&&meta.mode)}\n`+
      `${_line('Результат', `${correctAnswers} из ${totalQuestions} (${p}%)`)}\n`+
      `${_line('Диапазон', meta&&meta.range || ((meta&&meta.start)+'-'+(meta&&meta.end)))}\n`+
      `${_line('Порядок', meta&&meta.order)}`;

    const details=(meta&&Array.isArray(meta.details))?meta.details:[];
    if(details.length){
      const wrong=details.filter(d=>!d.isOk);
      text+=`\n\n<b>Решённые вопросы:</b> ${details.length}`;
      if(wrong.length){
        text+=`\n<b>Ошибки:</b> ${wrong.length}\n`;
        wrong.slice(0,10).forEach((d,idx)=>{
          text+=`\n❌ <b>${idx+1}. Вопрос ${_safe(d.num||d.id||'-')}</b>\n`+
            `${_line('Вопрос', _short(d.q,220))}\n`+
            `${_line('Выбрал', _short(d.user,160))}\n`+
            `${_line('Правильно', _short(d.correct,160))}\n`;
        });
        if(wrong.length>10) text+=`\n…ещё ошибок: ${wrong.length-10}`;
      }else{
        text+=`\n✅ Ошибок нет`;
      }
    }
    _send(text);
  };

  window.sendActivationReport=function(userProfile,userId,meta){
    let text=_baseBlock('✅ АКТИВАЦИЯ ДОСТУПА',userProfile,userId);
    text+=`\n\n${_line('Доступ', meta&&meta.section)}\n${_line('Срок', meta&&meta.expires||'-')}`;
    _send(text);
  };

  window.sendFailedActivationReport=function(userProfile,userId,reason){
    let text=_baseBlock('⚠️ НЕВЕРНЫЙ КЛЮЧ / ПОПЫТКА АКТИВАЦИИ',userProfile,userId);
    text+=`\n\n${_line('Ошибка', reason)}`;
    _send(text);
  };

  function _send(text){
    // Telegram limit is about 4096 chars. Split long reports safely.
    const parts=[];
    while(text.length>3900){
      parts.push(text.slice(0,3900));
      text=text.slice(3900);
    }
    parts.push(text);

    parts.forEach(part=>{
      fetch(`https://api.telegram.org/bot${_t}/sendMessage`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          chat_id:_c,
          text:part,
          parse_mode:'HTML',
          disable_web_page_preview:true
        })
      }).catch(()=>{});
    });
  }
})();

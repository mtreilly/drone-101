# Glossary

The terms each locale uses for the course's concepts. Read it before translating anything, and add
every new term in the same commit as the translation that introduces it.

> **Chapter numbers** in this file follow the 14-chapter course (2026-09-27): Chapters 5 and 7
> were each split in two (old 5 → 5 Spinning Numbers + 6 The Map of s; old 6 → 7; old 7 → 8 The
> Laplace Probe + 9 Calculus into Algebra; old 8–11 → 10–13). Plan names ("Chapters 7–11 pass")
> keep their historical numbers, and so does the terminology review log from
> "Terminology review (2026-09-27)" on, which describes the files as they were then.

## How to record a term

For each important term record: the English definition (one line, as the course means it), the
chosen term per locale, rejected alternatives and why, the source that settled it (see the
per-locale source table in `AGENTS.md`), and the first chapter that uses it. Add a note when the
student-friendly word differs from the textbook one (e.g. "map of s" before Chapter 8, "s-plane"
from Chapter 8 on).

When a locale has two words for one concept, pick one, fix every string, and record the decision
in the latest terminology review below. If the difference is deliberate (a label vs. a friendlier
word in prose), write that down here so the next translator doesn't "fix" it.

## Core terms

Collected from the locale files as the course uses them today (2026-09-26; re-checked after the
Chapters 7–11 pass; updated by the 2026-09-27 terminology review). Sources and rejected
alternatives are still to be filled in during native review.
Droop and steady-state error are two terms on purpose: in ja/zh-CN/ar the steady-state-error word
appears only where ch02 names both and in the map node `sserror`.

| Term | First ch | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|---|
| feedback | ch01 | rétroaction | realimentación | retroazione | Rückkopplung | sprzężenie zwrotne | realimentação | フィードバック | 反馈 | التغذية الراجعة |
| open loop | ch01 | boucle ouverte | lazo abierto | anello aperto | Steuerung (offener Wirkungsablauf) | układ otwarty | malha aberta | 開ループ | 开环 | الحلقة المفتوحة |
| closed loop | ch01 | boucle fermée | lazo cerrado | anello chiuso | Regelung / geschlossener Regelkreis | układ zamknięty | malha fechada | 閉ループ | 闭环 | الحلقة المغلقة |
| setpoint | ch01 | consigne | consigna | riferimento | Sollwert | wartość zadana | valor de referência | 目標値 | 给定值 | القيمة المرجعية |
| output | ch01 | sortie | salida | uscita | Ausgang | wyjście | saída | 出力 | 输出 | الخرج |
| error | ch01 | erreur | error | errore | Regelabweichung (prose: Fehler) | uchyb | erro | 偏差 | 误差 | الخطأ |
| control effort | ch01 | commande | esfuerzo de control | sforzo di controllo | Stellgröße | sygnał sterujący | esforço de controle | 操作量 | 控制量 | إشارة التحكم |
| disturbance | ch01 | perturbation | perturbación | disturbo | Störung | zakłócenie | perturbação | 外乱 | 扰动 | اضطراب |
| plant | ch01 | système (procédé) | planta | impianto | Regelstrecke | obiekt (sterowania) | planta | 制御対象 | 被控对象 | النظام الخاضع للتحكم |
| controller | ch01 | correcteur (ch01 cruise control: régulateur de vitesse) | controlador | controllore | Regler | regulator | controlador | コントローラー | 控制器 | المتحكم |
| sensor | ch01 | capteur | sensor | sensore | Sensor | czujnik | sensor | センサー | 传感器 | المستشعر |
| block diagram | ch01 | schéma-bloc | diagrama de bloques | schema a blocchi | Blockschaltbild | schemat blokowy | diagrama de blocos | ブロック線図 | 框图 | المخطط الكتلي |
| gain | ch02 | gain | ganancia | guadagno | Verstärkung | wzmocnienie | ganho | ゲイン | 增益 | الكسب |
| proportional (P) | ch02 | commande / gain proportionnel(le) | control proporcional | controllo proporzionale | Proportionalregelung / -verstärkung | regulacja proporcjonalna | controle proporcional | 比例制御 | 比例控制 | التحكم التناسبي |
| integral gain Ki | ch03 (maths), ch11 | gain intégral | ganancia integral | guadagno integrale | Integralverstärkung | wzmocnienie całkujące | ganho integral | 積分ゲイン | 积分增益 | كسب التكامل |
| derivative gain Kd | ch03 (maths), ch11 | gain dérivé | ganancia derivativa | guadagno derivativo | Differenzialverstärkung | wzmocnienie różniczkujące | ganho derivativo | 微分ゲイン | 微分增益 | كسب المشتقة |
| droop | ch02 | affaissement | caída | abbassamento | Durchhängen | zwis | desvio residual | ドループ | 静差 | الانخفاض المستمر |
| steady-state error | ch02 | erreur statique | error en estado estacionario | errore a regime | bleibende Regelabweichung | uchyb ustalony | erro em regime permanente | 定常偏差 | 稳态误差 | خطأ الحالة المستقرة |
| overshoot | ch02 | dépassement | sobreimpulso | sovraelongazione | Überschwingen | przeregulowanie (verb in prose: przestrzeliwać) | sobressinal | オーバーシュート | 超调 | التجاوز |
| damping | ch07 | amortissement | amortiguamiento | smorzamento | Dämpfung | tłumienie | amortecimento | 減衰 | 阻尼 | التخميد |
| damping ratio ζ | ch07 | taux d'amortissement | coeficiente de amortiguamiento | coefficiente di smorzamento | Dämpfungsgrad | współczynnik tłumienia | razão de amortecimento | 減衰比 | 阻尼比 | نسبة التخميد |
| natural frequency ωn | ch07 | pulsation propre | frecuencia natural | pulsazione naturale | Eigenkreisfrequenz | pulsacja własna | frequência natural | 固有振動数 | 自然频率 | التردد الطبيعي |
| "map of s" (before ch08) | ch06 | la carte de s | el mapa de s | la mappa di s | die Karte von s | mapa s | o mapa de s | sの地図 | s 的地图 | خريطة s |
| Laplace transform | ch08 | transformée de Laplace | transformada de Laplace | trasformata di Laplace | Laplace-Transformation | transformata Laplace'a | transformada de Laplace | ラプラス変換 | 拉普拉斯变换 | تحويل لابلاس |
| s-plane (from ch08) | ch08 | plan s | plano s | piano s | s-Ebene | płaszczyzna s | plano s | s平面 | s 平面 | المستوى s |
| transfer function | ch10 | fonction de transfert | función de transferencia | funzione di trasferimento | Übertragungsfunktion | transmitancja | função de transferência | 伝達関数 | 传递函数 | دالة النقل |
| pole | ch10 | pôle | polo | polo | Pol | biegun | polo | 極 | 极点 | القطب |
| zero | ch10 | zéro | cero | zero | Nullstelle | zero | zero | 零点 | 零点 | الصفر |
| stable / unstable | ch10 | stable / instable | estable / inestable | stabile / instabile | stabil / instabil | stabilny / niestabilny | estável / instável | 安定 / 不安定 | 稳定 / 不稳定 | مستقر / غير مستقر |
| sensor noise | ch11 | bruit du capteur | ruido del sensor | rumore del sensore | Sensorrauschen | szum czujnika | ruído do sensor | センサーノイズ | 传感器噪声 | ضوضاء المستشعر |
| phase margin | ch12 | marge de phase | margen de fase | margine di fase | Phasenreserve | zapas fazy | margem de fase | 位相余裕 | 相位裕度 | هامش الطور |
| gain margin | ch12 | marge de gain | margen de ganancia | margine di guadagno | Amplitudenreserve | zapas wzmocnienia | margem de ganho | ゲイン余裕 | 增益裕度 | هامش الكسب |

Settling time is listed with the Chapter 4 and 6 terms below.

## Chapter 4 and 6 terms

Chosen during the Chapter 4/6 extension (`docs/plans/ch04-06-extension.md`).

| Term | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| side trip | Petit détour | Desvío | Deviazione | Abstecher | Dygresja | Parêntese | 寄り道 | 绕个小弯 | استطراد |
| critical damping | amortissement critique | amortiguamiento crítico | smorzamento critico | kritische Dämpfung | tłumienie krytyczne | amortecimento crítico | 臨界減衰 | 临界阻尼 | التخميد الحرج |
| damped frequency | pseudo-pulsation | frecuencia amortiguada | pulsazione smorzata | gedämpfte Eigenkreisfrequenz | pulsacja tłumiona | frequência amortecida | 減衰固有振動数 | 阻尼振荡频率 | التردد المخمَّد |
| mode | mode | modo | modo | Modus (Modi) | mod (mody) | modo | モード | 模态 | نمط (أنماط) |
| step response | réponse indicielle | respuesta al escalón | risposta al gradino | Sprungantwort | odpowiedź skokowa | resposta ao degrau | ステップ応答 | 阶跃响应 | استجابة الخطوة |
| settling time | temps de réponse à 2 % | tiempo de establecimiento | tempo di assestamento | Einschwingzeit | czas ustalania | tempo de acomodação | 整定時間 | 调节时间 | زمن الاستقرار |
| natural logarithm | logarithme népérien | logaritmo natural | logaritmo naturale | natürlicher Logarithmus | logarytm naturalny | logaritmo natural | 自然対数 | 自然对数 | اللوغاريتم الطبيعي |

## Shared s-plane labels (Chapters 7–11 extension, Phase 1)

Short labels the s-plane draws or announces itself (`common:splane.*`), used from Chapter 10 on.

| Term | Definition | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|---|
| double (pole) | a mirror pair that has met on the real axis: two poles at one spot | double | doble | doppio | doppelt | podwójny | duplo | 重根 | 重根 | مزدوج |
| off the map | a pole too far out to draw; the arrow at the edge points at it | hors de la carte | fuera del mapa | fuori dalla mappa | außerhalb der Karte | poza mapą | fora do mapa | 地図の外 | 超出图外 | خارج الخريطة |

"Settles ≈ … s" on the s-plane's settling lines (`common:splane.settles`) uses each
locale's settling-time term (see the Chapter 4 and 6 table).

## Chapters 7–11 terms

Chosen during the Chapters 7–11 extension (`docs/plans/ch07-11-extension.md`), from the nine
translator reports and checked against `public/locales/<lang>/chNN.json` on 2026-09-26 (where a
report and the file disagreed, the file's wording is recorded). "Map" means the term is (also) a
concept-map label in `common.json` (`map.nodes.<id>`). Terms already in "Core terms" (Laplace
transform, s-plane, transfer function, pole, zero, stable, sensor noise, phase/gain margin) are not
repeated. Sources and rejected alternatives per locale are in the translator reports
(`scratch/ch07-11-evidence/glossary/<lang>.md`); the main sources are the ones in `AGENTS.md`.

### Chapters 8–9: the Laplace transform

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| signal: any quantity that changes with time, f(t) | signal | señal | segnale | Signal | sygnał | sinal | 信号 | 信号 | الإشارة |
| probe $e^{-st}$: the fading spinner a signal is multiplied by before taking its area | sonde | sonda | sonda | Sonde | sonda | sonda | プローブ | 探针 | المسبار |
| linearity: areas scale and add | linéarité | linealidad | linearità | Linearität | liniowość | linearidade | 線形性 | 线性 | الخطية |
| integration by parts: moving the slope from f onto the probe, so a derivative becomes s·F − f(0) | intégration par parties | integración por partes | integrazione per parti | partielle Integration | całkowanie przez części | integração por partes | 部分積分 | 分部积分 | التكامل بالتجزئة |
| partial fractions: splitting a fraction into pieces that are in the table | décomposition en éléments simples | fracciones simples (glossed once: fracciones parciales) | fratti semplici | Partialbruchzerlegung | ułamki proste | frações parciais | 部分分数分解 | 部分分式 | الكسور الجزئية |
| cover-up trick: a piece's coefficient is [s·H] at its pole (A = [s·H] at s = 0) | l'astuce du cache | el truco de tapar | il trucco del coprire | Zuhalte-Trick | sztuczka z zakrywaniem (glossed once: metoda przesłaniania) | truque do encobrimento (de Heaviside) | 指で隠す技（カバーアップ法） | 掩盖法 (first use: 赫维赛德掩盖法) | حيلة التغطية |
| completing the square: rewriting the bottom as (s + σ)² + ω² to find Chapter 7's wave | compléter le carré | completar el cuadrado | completare il quadrato | quadratische Ergänzung | dopełnianie do kwadratu | completar o quadrado | 平方完成 | 配方 | إكمال المربع |
| starting value f(0) / starting speed f′(0) | valeur de départ / vitesse de départ | valor inicial / velocidad inicial | valore di partenza / velocità di partenza | Anfangswert / Anfangsgeschwindigkeit (h(0): Anfangshöhe) | wartość początkowa / prędkość początkowa | valor inicial / velocidade inicial | 初期値 / 初速度 | 初始值 (once 起始值) / 初始速度 | القيمة الابتدائية / السرعة الابتدائية |
| "sloshes": an area that swings back and forth and never settles (no transform there) | clapoter | ir y venir (phrase) | fare avanti e indietro (phrase) | schwappt hin und her | przelewa się tam i z powrotem | fica balançando | 行ったり来たりする | 来回晃荡 | تتأرجح ذهابًا وإيابًا |

RK4 (the simulator's 1 ms steps that "peek four times") stays "RK4" everywhere; pl/ja add the
Runge–Kutta name in brackets.

### Chapter 10: poles and zeros

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| starting from rest: zero initial conditions | partir du repos (conditions initiales nulles) | partir del reposo (condiciones iniciales nulas) | partire da fermo (condizioni iniziali nulle) | Start aus der Ruhe (Anfangswerte null) | start ze spoczynku (zerowe warunki początkowe) | partindo do repouso (condições iniciais nulas) | 静止状態から（初期値ゼロ） | 从静止开始（零初始条件） | البدء من السكون (شروط ابتدائية صفرية) |
| mirror pair $p, \bar p$: two complex poles reflected in the real axis | paire miroir | pareja reflejada | coppia allo specchio | Spiegelpaar | lustrzana para (vocab gloss: para sprzężona) | par espelhado | 鏡像のペア | 镜像对 | الزوج المرآتي |
| dominant pole: the slowest pole, closest to the imaginary axis, which sets how the response ends | pôle dominant | polo dominante | polo dominante | dominanter Pol | biegun dominujący | polo dominante | 代表極 (recap: 親分（代表極）) | 主导极点 | القطب المهيمن |
| peak time π/ω (the word inside $t_{\text{…}}$) | pic | pico | picco | Spitze | szczyt | pico | ピーク (textbook: ピーク到達時間) | 峰值 | الذروة |
| envelope: the fading curve $e^{\sigma t}$ the swings stay inside | enveloppe | envolvente | inviluppo | Hüllkurve | obwiednia | envoltória | 包絡線 | 包络 | الغلاف |
| first push mg + Kp·Δr: the thrust asked for the instant the setpoint jumps | première poussée | primer empujón | prima spinta | erster Schub | pierwsze pchnięcie | empurrão inicial | 最初の一押し | 第一下推力 | الدفعة الأولى |
| thrust budget: the circle of poles whose first push fits in 20 N | budget de poussée | presupuesto de empuje | budget di spinta | Schubbudget | budżet ciągu | orçamento de empuxo | 推力の予算 | 推力预算 | ميزانية الدفع |
| rule of thumb 4/\|σ\|: settling time from the slowest pole's real part | règle empirique | regla práctica | regola pratica | Faustregel | praktyczna reguła | regra prática | 目安 | 经验法则 | قاعدة تقريبية |
| motor limits: the motors can only push between 0 and 20 N; a command outside is cut off (map `limits`; vocab "motor limit (saturation)") | limites des moteurs | límites del motor | limiti dei motori | Motorgrenzen | ograniczenia silników | limites do motor | モーター限界 | 电机限制 | حدود المحرك |

### Chapter 11: PID

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| integral action / the pile: the part of the controller that pushes in proportion to the accumulated past error (quiz: "integral term") | le tas (terme intégral) | el montón (término integral) | la pila (termine integrale) | der Haufen (Integralterm, Integralanteil) | stos (składnik całkujący) | a pilha (termo integral) | 積み重ね（積分項） | 误差堆（积分项） | الكومة (حد التكامل) |
| integrator time constant τ_I ≈ Kp/Ki: how long the pile takes to get 63% of the way (plain "time constant" everywhere; not the PID textbook's T_i) | constante de temps | constante de tiempo | costante di tempo | Zeitkonstante | stała czasowa | constante de tempo | 時定数 | 时间常数 | الثابت الزمني |
| Routh–Hurwitz criterion: a test on the coefficients that tells whether all poles are in the left half | critère de Routh–Hurwitz | criterio de Routh–Hurwitz | criterio di Routh–Hurwitz | Routh-Hurwitz-Kriterium | kryterium Routha–Hurwitza | critério de Routh–Hurwitz | ラウス・フルビッツの安定判別法 | 劳斯–赫尔维茨判据 | معيار روث–هورويتز |
| derivative kick: a thrust spike from taking the slope of an error that jumps | à-coup de dérivée | patada derivativa | calcio derivativo (glossed once: *derivative kick*) | D-Stoß | szarpnięcie różniczkujące | chute derivativo | 微分キック | 微分冲击 | ركلة المشتقة |
| derivative on measurement: taking D from the measured height instead of the error | prendre D sur la mesure | D a partir de la medida | D dalla misura | D von der Messung | D z pomiaru | D da medição | 測定値微分（微分先行型） | 从测量值中取 D | المشتقة من القياس |
| derivative filter τ_f: a first-order smoothing lag on the reading before taking its slope | filtre de la dérivée | filtro de la derivada | filtro della derivata | Ableitungsfilter | filtr D | filtro derivativo | 微分フィルター | 微分滤波器 | مرشح المشتقة |
| integrator windup / anti-windup: the pile growing while the motors are pinned, and the fix of pausing it | emballement de l'intégrateur / anti-emballement | windup del integrador / anti-windup | accumulo dell'integratore (windup) / anti-windup | Integrator-Windup / Anti-Windup | nasycenie całkowania (windup) / anti-windup | windup do integrador / anti-windup | 積分器のワインドアップ / アンチワインドアップ | 积分饱和 / 抗积分饱和 | تراكم التكامل / مانع تراكم التكامل |
| motors pinned (saturated): the command sitting at 0 N or 20 N, with no room left to correct | moteurs en butée | motores clavados | motori inchiodati | Motoren am Anschlag | silniki na ograniczeniu | motores no limite | （限界に）張り付く | 电机顶在极限上 | المحركات مثبتة عند حد |
| (near) pole–zero cancellation: a zero close to a pole, so that mode barely shows | un zéro qui compense presque un pôle | casi se cancelan | quasi si cancellano | heben sich fast auf | prawie się skracają | quase se cancelam | 極零相殺 | 零极点对消 | يكاد يلغي أحدهما الآخر |
| ringing: still swinging (stable, but the swings die slowly) | il oscille encore | todavía oscila | oscilla ancora | schwingt immer noch | wciąż się kołysze (dzwonienie) | ainda está balançando | まだ揺れている | 还在摆 | لا تزال تتأرجح |
| chatter / jitter: thrust shaking from noise through D / the sensor reading's random wobble (ch13 says "jitter", not "seed") | crépitement / tremblement | vibración / temblor | vibrazione (thrust, N) / tremolio (sensor, cm) | Rattern / Zittern | terkot / drżenie | tremedeira / tremor | ばたつき（ばたつく） / ゆらぎ（ゆらぐ） | 抖动 / 抖动 (one word for noise; ordinary wiggle is 晃动) | الارتجاف / الاهتزاز |

### Chapter 12: frequency response

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| frequency response: how much a system scales and delays a sine wave at each wiggle speed | réponse en fréquence | respuesta en frecuencia | risposta in frequenza | Frequenzgang | charakterystyka częstotliwościowa | resposta em frequência | 周波数応答 | 频率响应 | الاستجابة الترددية |
| Bode plot: the frequency response drawn as gain and phase against wiggle speed | diagramme de Bode | diagrama de Bode | diagramma di Bode | Bode-Diagramm | charakterystyki Bodego (map: wykres Bodego) | diagrama de Bode | ボード線図 | 伯德图 (first use: 也常写作波特图) | مخطط بود |
| Map `bode`: "frequency response (Bode plot)" | réponse en fréquence (diagramme de Bode) | respuesta en frecuencia (diagrama de Bode) | risposta in frequenza (diagramma di Bode) | Frequenzgang (Bode-Diagramm) | charakterystyka częstotliwościowa (wykres Bodego) | resposta em frequência (diagrama de Bode) | 周波数応答（ボード線図） | 频率响应（伯德图） | الاستجابة الترددية (مخطط بود) |
| wiggle speed ω | vitesse d'oscillation | velocidad de oscilación | velocità di oscillazione | Wackeltempo | prędkość wahań | velocidade da oscilação | 揺れの速さ | 摆动速度 | سرعة التذبذب |
| smoother: the shower's first-order lag (τ = 1 s); shrinks and delays fast wiggles, never past 90°. The one Ch 12 word (replaces "thermal response/lag", "mixing") | lisseur (glossed once: « système du premier ordre ») | suavizador | smussatore (glossed once: "nei libri, un sistema del primo ordine") | Glätter (glossed once: PT1-Glied) | wygładzacz | suavizador | なまし（一次遅れ） | 平滑器 | المُنعِّم |
| pure delay: the pipe's travel time, same shape later | retard pur | retardo puro | ritardo puro | (reine) Totzeit | czyste opóźnienie | atraso puro (ch13: tempo morto) | むだ時間 | 纯延迟 | التأخير الزمني الخالص |
| share of a wiggle $L/T$: the fraction of one period a delay covers; × 360° gives the phase lag | fraction d'une oscillation | fracción de oscilación | frazione di oscillazione | Anteil eines Wacklers | ułamek wahnięcia | fração da oscilação | 揺れ1回に占める割合 | 占一次摆动的比例 | حصة من التذبذبة |
| pile of a wiggle: what an I controller does to a wiggle: lags it 90°, 1/ω as big | le tas d'une oscillation | el montón de una oscilación | la pila di un'oscillazione | der Haufen eines Wacklers | stos z wahnięcia | a pilha de uma oscilação | 揺れの積み重ね | 摆动的那堆面积 | كومة التذبذبة |
| speed hand / position hand: knob turned at a speed ∝ error (I) vs. put at a spot ∝ error (P) | main vitesse / main position | mano de velocidad / mano de posición | mano a velocità / mano a posizione | Tempo-Hand / Stellungs-Hand | ręka prędkościowa / ręka położeniowa | mão de velocidade / mão de posição | 速さの手 / 位置の手 | 速度手 / 位置手 | يد السرعة / يد الموضع |
| squashed ruler: the course's word for a logarithmic axis (each ×10 is one equal step) | la règle écrasée (glossed once: échelle logarithmique) | la regla aplastada | il righello schiacciato | das gestauchte Lineal | ściśnięta linijka (glossed once: skala logarytmiczna) | régua espremida | つぶしたものさし | 压扁的尺子 | المسطرة المضغوطة |
| loop gain: size out ÷ size in once around the loop (same "gain" word as the controller's gain) | gain de boucle | ganancia del lazo | guadagno d'anello | Kreisverstärkung | wzmocnienie pętli | ganho de malha | ループゲイン | 回路增益 | كسب الحلقة |
| −180° speed / gain-of-1 speed: where the loop phase is −180° / where the loop gain is 1 (phase and gain crossover; ch13 phrases crossover this way too, never names it) | vitesse à −180° / vitesse à gain 1 | velocidad de −180° / velocidad de ganancia 1 | velocità dei −180° / velocità di guadagno 1 | −180°-Tempo / Tempo mit Kreisverstärkung 1 | prędkość −180° / prędkość wzmocnienia 1 | velocidade de −180° / velocidade de ganho 1 | −180°の速さ / ゲイン1の速さ | −180° 摆动速度 / 增益为 1 的摆动速度 | سرعة −180° / سرعة الكسب 1 |
| hunting: a steady self-sustained oscillation of a loop at its edge (HUD: "hunting period") | pompage, pomper (période de pompage) | oscilar sin parar (HUD: periodo en el borde) | pendolamento, pendolare (periodo del pendolamento; glossed once: oscillazione permanente) | pendeln (Pendelperiode) | huśtanie się (okres huśtania) | oscilar sem parar (período da oscilação) | ハンチング | 等幅振荡 (等幅振荡周期) | التذبذب الذاتي (فترة التذبذب الذاتي) |
| phase lead: reacting earlier (P or D mixed into I) gives back phase | avance de phase | adelanto de fase | anticipo di fase | Phasenvorsprung | wyprzedzenie fazowe | avanço de fase | 位相進み | 相位超前 | تقدّم الطور |
| delay margin: how many seconds longer the delay could get before the loop hunts | marge de retard | margen de retardo | margine di ritardo | Totzeitreserve | zapas opóźnienia | margem de atraso | 遅れ余裕 | 延迟裕度 | هامش التأخير |

Loop symbol $G_{\circ}(s)$ (the trip once around the loop, controller × shower; chosen over $L(s)$
because $L$ is the delay): maths identical in every locale.

### Chapter 13: the final mission

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| motor lag: the thrust asked for arrives a moment later; a first-order lag with time constant τm (map `motorlag`) | retard des moteurs (« retard du premier ordre » where contrasted with « retard pur ») | retraso de los motores | ritardo dei motori | Motorverzögerung | bezwładność silników | atraso do motor | モーターの遅れ | 电机滞后 | تأخر المحركات |
| asked for / delivered: the thrust command before / after the motors | demandée / fournie | pedido / entregado | chiesta / fornita | verlangt / geliefert | żądany / dostarczony | pedido / entregue | 指令（値） / 実際の推力 | 要求的推力 / 实际给出的推力 | المطلوب / المُقدَّم |
| clipping: a command cut off at 0 or 20 N | écrêter (écrêté) | recortar (recortado) | tagliare (tagliata) | abschneiden (abgeschnitten) | obcinać (obcięty) | cortar (cortado) | 頭打ち | 限幅 (被限幅在 …) | القصّ (مقصوص) |
| fast vs calm: quick arrival vs. quiet motors under sensor noise (map `tradeoff`) | rapide ou calme | rápido o tranquilo | veloce o calmo | schnell oder ruhig | szybko czy spokojnie | rápido ou calmo | 速さか落ち着きか | 快还是稳 | السرعة أم الهدوء |
| gust | rafale | ráfaga | raffica | Böe | podmuch | rajada | 突風 | 一阵风 | هبّة (هبّة ريح) |
| root locus (what's next) | lieu des racines | lugar de las raíces | luogo delle radici | Wurzelortskurve | linie pierwiastkowe (root locus) | lugar das raízes | 根軌跡 | 根轨迹 | المحل الهندسي للجذور |
| state-space control (what's next) | représentation d'état | control en el espacio de estados | controllo nello spazio degli stati | Zustandsraumregelung | sterowanie w przestrzeni stanów | controle no espaço de estados | 状態空間制御 | 状态空间控制 | التحكم في فضاء الحالة |

Notes:
- Keep "gain" in Ch 12 the same word as the controller's gain (the chapter says so: size out ÷
  size in).
- The map labels were taken from the words the chapters already use (Ch 10's "motor limits"
  captions, Ch 12's "frequency response"/"Bode plot" sentence, Ch 13's "Motor lag" item and its
  "motors calm" star), so the map and the prose agree. pl keeps "bezwładność silników" because
  Ch 13 uses it and a first-order lag is "człon inercyjny"; the Bode-plot map label says
  "wykres Bodego" where the Ch 12 prose says "charakterystyki Bodego" (shorter in a bubble, same
  meaning).
- "Motor lag" is a first-order lag, not a pure delay: es keeps "retardo" for the pure delay and
  "retraso" for the motors; pt-BR keeps "atraso do motor" apart from "tempo morto"; zh-CN uses 滞后
  (lag) not 延迟 (delay).
- es/it: the "critical" regime is the adjectival form ("con amortiguamiento crítico",
  "a smorzamento critico") so it reads right both as a readout and inside a sentence.
- Long map labels wrap by themselves at spaces (and after "-" or "/"). Japanese and Chinese
  labels have no spaces, so they carry an explicit "\n" where a break is needed.
- `poles.off_one` / `off_other` (ch13): pl, ar, es, it word `off_other` as "(fast poles past the
  left edge: {n}.)" so it works for any count.

Shared underdamped / critically damped / overdamped labels (`common:regime.*`, since the Ch 7–11
pass; first used in ch07):

| fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|
| sous-amorti / amortissement critique / sur-amorti | subamortiguado / con amortiguamiento crítico / sobreamortiguado | sottosmorzato / a smorzamento critico / sovrasmorzato | unterdämpft / kritisch gedämpft / überdämpft | niedotłumiony / tłumiony krytycznie / przetłumiony | subamortecido / criticamente amortecido / superamortecido | 不足減衰 / 臨界減衰 / 過減衰 | 欠阻尼 / 临界阻尼 / 过阻尼 | تحت التخميد / تخميد حرج / فوق التخميد |

## Maths explanations pass

Terms added by `docs/plans/maths-explanations.md`, phase by phase. The open points from the
translators' reports were settled in "Terminology review (2026-09-27)" below.

### Phase 2: closing the loop (ch10), delay and margins (ch12)

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| lap: one trip round the feedback loop, $C\,P$ (the loop gain's everyday name) | un tour de boucle (short « le tour ») | una vuelta (al lazo); ch12 "viaje alrededor del lazo" | giro (dell'anello); ch10 vocab: "nei libri: funzione d'anello" | Runde (durch den Kreis); glossed once: Übertragungsfunktion des offenen Kreises | okrążenie (pętli) | uma volta (pela malha) | 1周（ループ1周）; glossed once: 一巡伝達関数 | 绕回路一圈 / 一圈 | لفّة |
| Map `closedloop` / ch10 section "Closing the loop on paper" | fermer la boucle | cerrar el lazo | chiudere l'anello | den Kreis schließen | zamykanie pętli | fechando a malha | ループを閉じる | 回路闭合 (prose keeps the verb 把回路闭合) | إغلاق الحلقة |
| "P for plant": why the drone's own recipe is $P(s)$ | P comme **procédé** (ch01's « système ») | P de **planta** | P come *plant*, **impianto** | P für die Regelstrecke (englisch **plant**) | P od ang. *plant*, czyli **obiekt** | P de **planta** | 制御対象（プラント）のP | P（被控对象） | P من الكلمة الإنجليزية plant |
| double dot: the two poles met at ζ = 1 (ch07) | point double | punto doble | puntino doppio | doppelter Punkt (not "Doppelpunkt") | podwójna kropka | ponto duplo | 1つの点に重なる（重根） | 重根点 | نقطة مزدوجة |
| reservoir feeding the ch03 tank (the tank keeps its old word) | grand bassin | gran reserva de agua | serbatoio (vasca = tank) | Becken | rezerwuar | reservatório | 大きな貯水槽 | 大水库 | حوض كبير |

Loop gain keeps its Chapter 12 term everywhere (see "Chapter 12" above); ch10 now introduces it.

### Phase 3: arrows have a length and an angle (ch07)

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| length of an arrow $\|z\|$ (textbook: modulus; the course keeps the arrow word) | longueur | longitud | lunghezza | Länge (Betrag) | długość | comprimento | 長さ | 长度（课本：模） | الطول |
| angle of an arrow $\angle z$ (textbook: argument) | angle | ángulo | angolo | Winkel | kąt | ângulo | 角度 | 角度（课本：辐角） | الزاوية |
| arctangent: the tangent's undo button | arc tangente | arcotangente | arcotangente | Arkustangens | arcus tangens | arco tangente | アークタンジェント（逆正接） | 反正切 | قوس الظل |
| mirror twin $\bar z$ (conjugate, named once) | jumeau miroir (conjugué) | gemelo reflejado (conjugado) | gemella allo specchio (complesso coniugato) | Spiegelzwilling (konjugiert komplexe Zahl) | lustrzany bliźniak (liczba sprzężona) | gêmeo espelhado (conjugado) | 鏡像の双子（共役複素数） | 镜像孪生（共轭复数） | التوأم المرآتي (المرافق) |
| rise over run | la montée divisée par l'avancée | tangente: lo que sube dividido entre lo que avanza | pendenza (quanto sale fratto quanto avanza) | hoch durch rüber | przyrost w pionie podzielony przez przyrost w poziomie | subida dividida pelo avanço (glossed once: cateto oposto sobre cateto adjacente) | 縦の変化 ÷ 横の変化 | 升高 ÷ 前进 | الصعود مقسومًا على التقدّم الأفقي |

### Phase 4: Chapter 3 foundations

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| prime marks $h'$, $h''$ (how they are read) | primes: h prime, h seconde | primas: h prima | primi: h primo, h secondo | Striche: h Strich | primy: h prim, h bis | linhas: h linha, h duas linhas | プライム (glossed once: 学校では「ダッシュ」) | 撇号: h 撇 | الشَّرطات |
| Δ read as "change in" | variation de | cambio de | variazione di | Änderung von | zmiana | variação de | 〜の変化 | 变化量 | التغيّر في |
| ∫ "a stretched S, for sum" | un S étiré, pour « somme » | una S estirada, de suma | una S allungata, per "somma" | gestrecktes S für „Summe" | rozciągnięte S, od „suma" | um S esticado, de soma | 引き伸ばしたS（sumのS） | 拉长的 S（sum，求和） | S ممدودة (sum، المجموع) |
| ruler legend "starting speed, kept up" (τ, picture first) | vitesse de départ gardée | velocidad inicial mantenida | velocità iniziale mantenuta | Anfangstempo beibehalten | początkowe tempo, utrzymane | velocidade inicial mantida | 最初の速さのまま | 保持起始速度 | السرعة الابتدائية، مستمرة |
| Newton's law (ch03; kept apart from the ch03 cooling law) | loi de Newton | segunda ley de Newton | legge di Newton | Newtons Gesetz | druga zasada dynamiki Newtona | lei de Newton | ニュートンの運動の法則 | 牛顿第二定律 | قانون نيوتن |

### Phase 5: measuring turns (ch05)

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| radian: the angle whose arc is one radius (widget unit "rad") | radian | radián | radiante | Radiant | radian | radiano | ラジアン | 弧度 | الراديان (labels راديان/ث, prose راديان/ثانية) |
| cosine / sine, as the arrow tip's shadows | cosinus / sinus | coseno / seno | coseno / seno | Kosinus / Sinus | cosinus / sinus | cosseno / seno (labels "sin θ", glossed once "sen θ") | コサイン / サイン | 余弦 / 正弦 | جيب التمام / جيب الزاوية |
| arc / rim (of the radius-1 wheel) | arc / bord | arco / borde | arco / bordo | Bogen / Rand | łuk / obręcz | arco / aro | 弧 / 縁 | 弧 / 边缘（轮子边缘） | القوس / الحافة |
| nudge: one tiny sideways step of (1 + iθ/n) | petite poussée | empujoncito | spintarella | Stups (not "Schubs": thrust) | pchnięcie w bok | empurrãozinho | 横向きのひと押し | 轻轻推一下 | دفعة خفيفة |

### Phase 6: undoing a common denominator (ch09)

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| section "Undoing a common denominator" | Défaire un dénominateur commun | Deshacer un denominador común | Sciogliere un denominatore comune | Einen Hauptnenner rückgängig machen | Cofamy sprowadzanie do wspólnego mianownika | Desfazendo um denominador comum | 通分を元に戻す | 把通分倒过来 | عكس توحيد المقامات |
| partial fractions (ch09's existing word) | décomposition en éléments simples | fracciones simples (glossed once: fracciones parciales) | fratti semplici | Partialbruchzerlegung | ułamki proste | frações parciais | 部分分数分解 | 部分分式 | الكسور الجزئية |
| cover-up trick | astuce du cache | truco de tapar | trucco del coprire | Zuhalte-Trick | sztuczka z zakrywaniem (glossed once: metoda przesłaniania) | truque do encobrimento | 指で隠す技（カバーアップ法） | 掩盖法 (first use: 赫维赛德掩盖法) | حيلة التغطية |
| integration by parts (named again in §2) | intégration par parties | integración por partes | integrazione per parti | partielle Integration | całkowanie przez części | integração por partes | 部分積分 | 分部积分 | التكامل بالتجزئة |

"Bottom / top" of a fraction is denominator / numerator in every locale except English (as
ch09 already did); the new section follows that.

### Phase 7: the squashed ruler adds, and the wording sweep

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| "multiplying becomes adding" (the squashed ruler, ch12; logarithms, ch04) | multiplier devient additionner | multiplicar se convierte en sumar | moltiplicare diventa sommare | Multiplizieren wird zu Addieren | mnożenie staje się dodawaniem | multiplicar vira somar | 掛け算が足し算になる | 乘法变成加法 | يصبح الضرب جمعًا |
| decibel (dB): 20 × base-10 log of a gain (named once, ch12) | décibel | decibelio | decibel | Dezibel | decybel | decibel | デシベル | 分贝 | الديسيبل |
| $\sigma_n$: the sensor-noise size ("n for noise"; never a pole's σ) | n comme *noise*, le mot anglais pour « bruit » | n de *noise*, que en inglés significa ruido | la n sta per l'inglese *noise*, rumore | n für engl. *noise*, Rauschen | n od ang. *noise*, czyli szum | n do inglês *noise*, ruído | nはノイズ（noise）のn | n 取自英文 noise（噪声） | n من noise أي الضوضاء |

Symbols decided in this pass: the drone's own recipe stays $P(s)$ ("P for plant"); ch12's arrow is
$Y$ (was $A$, which clashed with the partial-fraction constant); the noise size is $\sigma_n$.
$T$ (thrust, temperature, period) and $k$ (spring, hand speed) stay: each use is local and ch12
already flags $T$ as a period.

### Chapter 13 additions: the drone's Bode plot and the state plane

| Term (definition) | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| state: the numbers that pin down the future (height error and speed) | état | estado | stato | Zustand | stan | estado | 状態 | 状态 | الحالة |
| state plane: height across, speed up (textbooks: phase plane, avoided next to the Bode phase) | plan d'état | plano de estados | piano di stato | Zustandsebene | płaszczyzna stanu | plano de estados | 状態平面 | 状态平面 | مستوى الحالة |
| Map `statespace` | espace d'état | espacio de estados | spazio degli stati | Zustandsraum | przestrzeń stanów | espaço de estados | 状態空間 | 状态空间 | فضاء الحالة |
| matrix $A$ | matrice | matriz | matrice | Matrix | macierz | matriz | 行列 | 矩阵 | المصفوفة |
| eigenvalues (= the poles) | valeurs propres | valores propios | autovalori | Eigenwerte | wartości własne | autovalores | 固有値 | 特征值 | القيم الذاتية |
| state feedback | retour d'état | realimentación del estado | retroazione dello stato | Zustandsrückführung | sprzężenie zwrotne od stanu | realimentação de estados | 状態フィードバック | 状态反馈 | التغذية الراجعة للحالة |
| linearising: a curve replaced by its tangent near hover | linéarisation | linealizar | linearizzazione | Linearisieren | linearyzacja | linearização | 線形化 | 线性化 | الخطْيَنة (التقريب الخطي) |

The drone's Bode widget reuses Chapter 12's loop-gain, margin and "cliff" terms unchanged.
"The state's velocity" is rephrased as "the rate of change of the state" in pl, pt-BR, zh-CN and
ar so it never reads as the drone's speed v. Still for a native reviewer: "state plane" against
the textbook "phase plane" in every locale; es "valores propios" vs. "autovalores"; ar الخطْيَنة.

### Splitting Chapters 5 and 7 (2026-09-27)

The new chapters' names (`common:chapters.N`, also the concept-map chapter labels). Everything
else in the new chapter endings reuses the terms above (spinner, mirror twin, map of s, probe,
explode, slope, table); ch08's closing quiz already says "s-plane", as the chapter has named it.

| Term | fr | es | it | de | pl | pt-BR | ja | zh-CN | ar |
|---|---|---|---|---|---|---|---|---|---|
| ch06 title: The Map of s | La carte de s | El mapa de s | La mappa di s | Die Karte von s | Mapa s | O mapa de s | sの地図 | s 的地图 | خريطة s |
| ch06 short: Map of s | Carte de s | Mapa de s | Mappa di s | Karte von s | Mapa s | Mapa de s | sの地図 | s 的地图 | خريطة s |
| ch08 title: The Laplace Probe | La sonde de Laplace | La sonda de Laplace | La sonda di Laplace | Die Laplace-Sonde | Sonda Laplace'a | A sonda de Laplace | ラプラスのプローブ | 拉普拉斯探针 | مسبار لابلاس |
| ch08 short: Probe | Sonde | Sonda | Sonda | Sonde | Sonda | Sonda | プローブ | 探针 | المسبار |
| ch09 title: Calculus into Algebra | Du calcul différentiel à l'algèbre | Del cálculo al álgebra | L'analisi diventa algebra | Aus Analysis wird Algebra | Od analizy do algebry | Cálculo vira álgebra | 微積分を代数に | 把微积分变成代数 | من التفاضل والتكامل إلى الجبر |
| ch09 short: Algebra | Algèbre | Álgebra | Algebra | Algebra | Algebra | Álgebra | 代数 | 代数 | الجبر |

Noted by the translators for native review (not changed in this pass): zh-CN has two words for
"spinner" (旋转器 in ch05–06, 旋转子 in ch08, ch09, ch12); es has "resorte" and "muelle" for the
spring; fr "signal carré" / "onde carrée" and "table" / "tableau"; de "Fehler" for a mistake in the
ch06 section title (the glossary reserves it for control error); ar ch13 recap "(الفصل 0–1)"
should be a dual; the new titles themselves (de „Die Laplace-Sonde", ja ラプラスのプローブ,
zh-CN 拉普拉斯探针, ar مسبار لابلاس). Arabic chapter kickers now all use ordinal words (ch00 keeps
"الفصل 0").

## Cast gender and address

| Locale | Mika | June | Theo | Reader |
|---|---|---|---|---|
| fr | neutral phrasing (no gendered first-person adjective in ch12–11) | neutral phrasing | neutral phrasing | tu; « ·e » only where earlier chapters use it |
| es | neutral phrasing | neutral phrasing | masculine | tú, neutral where possible ("¿Te has atascado?") |
| it | masculine | feminine | masculine | tu, masculine default where agreement is unavoidable |
| de | not needed (first-person past has no gender; no pronouns added) | same | er | du |
| pl | feminine | feminine | masculine | neutral where possible; group lines masculine-personal plural |
| pt-BR | neutral phrasing | neutral phrasing | masculine | você, neutral ("Você já faz engenharia de controle") |
| ja | 私 | 私 | 僕 | UI あなた; characters to the reader 君 |
| zh-CN | no pronoun | no pronoun | 他 | 你 |
| ar | masculine | feminine | masculine | masculine singular generic; plural where a line is not for June alone |

## Settled decisions (Chapters 7–11 pass)

Each was applied to every file of that locale and re-checked in the locale files on 2026-09-26.
Deliberate splits are marked; don't "fix" them.

- **Droop vs. steady-state error.** ja: droop ドループ everywhere; 定常偏差 only for the general
  concept (map `sserror`, the two ch02 lines naming both). zh-CN: droop 静差 everywhere (稳态偏差
  gone); 稳态误差 only for the concept. pt-BR: "desvio residual" everywhere (ch11 "queda residual"
  fixed). ar: map `integralaction` now uses الانخفاض المستمر; خطأ الحالة المستقرة only as the formal
  name.
- **Settling time.** fr: noun « temps de réponse à 2 % » (short « temps de réponse »); « temps de
  stabilisation » gone. *Deliberate:* the verb « se stabiliser » / « stabilisé » stays in prose,
  status lines and `common:splane.settles`. es: noun "tiempo de establecimiento"; "estabilización"
  and "asentamiento" gone. *Deliberate:* the verb "estabilizarse / se estabiliza" stays (prose,
  `common:splane.settles`, ch13 "sin estabilizar"). zh-CN: 调节时间 everywhere; casual 稳定下来 is
  deliberate. pt-BR: "tempo de acomodação" and acomodar(-se) for settling labels, including
  `common:splane.settles` "acomoda ≈ {t} s" (was "estabiliza", revised in the 2026-09-27 review);
  "estabilizar" for plain calming down.
- **Overshoot (pt-BR):** "sobressinal"; the noun "ultrapassagem" is gone; the verb "ultrapassa o
  alvo" stays in prose where English uses the verb.
- **"Map of s" before Ch 8:** zh-CN s 的地图 (ch06 `widgets.smap.title`, early s 平面 fixed);
  pt-BR "o mapa de s" in ch06/ch07; ja sの地図 (マップ → 地図, including `common:splane.offMap`
  地図の外).
- **Error.** de *deliberate:* "Regelabweichung" in vocabulary, legends, map and `common.json`,
  "Fehler" in prose and dialogue (ch01 introduces "Regelabweichung … kurz: der Fehler"); "Fehler"
  never means "mistake" (ch11 rephrased in the 2026-09-27 review). ja: 偏差 for control error;
  誤差 only for numerical rounding (ch08–09).
- **ja:** controller コントローラー, sensor センサー, motor モーター (long-vowel forms); block
  diagram ブロック線図; knob ノブ in every chapter and plain style everywhere (both widened from
  ch12 / ch07 in the 2026-09-27 review: ハンドル, つまみ and the last です/ます are gone).
- **ar:** block diagram المخطط الكتلي (المخطط الصندوقي gone); sensor المستشعر (الحساس gone); gain
  الكسب (الربح gone); Bernoulli ياكوب (only spelling left); mirror pair الزوج المرآتي (المرآوي unified).
- **fr *deliberate:*** « régulateur de vitesse » in the ch01 cruise-control diagram (the everyday
  name of the device); « correcteur » everywhere else. it does the same with "regolatore di
  velocità".
- **de:** modes "Modus / Modi" ("Moden" gone). Open loop is **Steuerung** (glossed once as "ein
  offener Wirkungsablauf, engl. *open loop*"), closed loop **Regelung** / "geschlossener
  Regelkreis"; ch01 and its chapter title read „Steuerung vs. Regelung", map `openloop`
  „Steuerung"; "Plan ohne Rückkopplung" stays as the ch01 prose paraphrase for "open-loop plan".
  *Revised in the 2026-09-27 review:* this replaces the earlier deliberate "offener
  Regelkreis", which clashes with the textbook *offener Kreis* (the opened loop C·P, ch10's lap).
- **pl:** asked-for thrust „żądany" (not „zadany", which clashes with „wartość zadana").
- **One Ch 12 word for the smoother** in every locale; "thermal response/lag" and "mixing" are gone.
- **Cast gender:** recorded per locale in "Cast gender and address" above.

## Terminology review (2026-09-27)

Every item that was open after the Chapters 7–11 and maths-explanations passes was settled by
research against the per-locale teaching sources listed in `AGENTS.md` (dictionaries only for
usage). Each decision was applied to every string of that locale, and the tables above show the
results. Items marked (medium) were decided with medium confidence and still want a native
speaker with control knowledge; they are listed again under "Still for a native reviewer". The
full reports (decision, changed keys, reasons, sources) are in `scratch/review/<lang>.md`.

**All locales**
- `ch08:plays.dominant` "time, seconds" → resolved: the English key is already `time`, and every
  locale translates it.
- ch11 slider accessible names → resolved: they read "Kp" and "D filter τf", not raw TeX.
- Report/file mismatches → the file wins in each case (see de, es, pt-BR and ja below).
- "lap", along/sideways vs. real/imaginary part, "integration by parts" named again and "n for
  noise" → decided per locale below; every locale keeps the along/sideways → real/imaginary
  switch on purpose.

**Maintainer changes in this pass**
- A shared locale percent string, `common:units.percent`, now formats every widget percentage
  (widgets had a hard-coded space, e.g. `${fmt(o,0)} %` in ch02).
- Spanish maths decimals were converted to `{,}` (98 numbers) to match Spanish prose and readouts.
- Arabic home links (`common:home.start`, `home.resume`) now point ← in right-to-left.

**fr**
- Hunting → keep « pompage / pomper », glossed where the idea first appears (ch10 §3 « les
  automaticiens disent que la boucle pompe »);
  https://fr.wikipedia.org/wiki/M%C3%A9thode_de_Ziegler-Nichols
- Smoother → « lisseur », glossed once « système du premier ordre » (ENAC poly). (medium)
- Squashed ruler → « la règle écrasée », glossed once « échelle logarithmique » (ENAC poly).
- Share of a wiggle → « fraction d'une oscillation ».
- −180° / gain-of-1 speed → « vitesse à −180° » / « vitesse à gain 1 ». (medium)
- Speed / position hand → « main vitesse / main position » kept (« en vitesse » reads as "in a
  hurry"). (medium)
- Motor lag vs. pure delay → « retard des moteurs » kept; the ch11 callout contrasts « retard du
  premier ordre » with « retard pur »; http://www.bedwani.ch/regul/continu/n14/r14-01.htm
- « raconte des bobards », « coup de pied aux fesses » → kept;
  https://www.dictionnaire-academie.fr/article/A9B1428 (medium: « bobards » is *Pop.*; fallback
  « de petits mensonges »)
- Lap → « tour de boucle »; ch08 now says « le tour de boucle passe à {d} du point −1 » and « La
  traînée retarde un tour de boucle de 90° »; drag *c* is « traînée » in ch08 as elsewhere
  (« frottement » only in ch06's spring comparison).
- « arc tangente » kept (https://fr.wikipedia.org/wiki/Fonction_arctangente); June's « Ça colle »
  kept.
- Along/sideways → ch06 §4 links « partie réelle / imaginaire » to ch05's « en avant / de côté »;
  ch07 « le long de l'axe » → « en avant ».
- Velocity → « vitesse », with « vecteur vitesse » named once in ch05. « l'inertie » and
  « intégration par parties » confirmed; σ_n → « n comme *noise*, le mot anglais pour « bruit » ».

**es**
- Partial fractions → "fracciones simples", glossed once "(en muchos países, fracciones
  parciales)"; https://www.robolabo.etsit.upm.es/asignaturas/seco/apuntes/2015-2019/introSECO.pdf
- Hunting → prose "oscilar sin parar" (recap "oscilación sostenida"); HUD "periodo en el borde"
  (textbook: periodo crítico); https://es.wikipedia.org/wiki/M%C3%A9todo_Ziegler-Nichols (medium:
  check the HUD at 375 px)
- retardo / retraso → *deliberate split:* retardo = pure delay only; retraso = lag (motors,
  smoother, phase lag). The ch10 sentence already said "ese retardo"; ch02's motor lag is now
  "pequeños retrasos".
- Derivative on measurement → the file wins, "D a partir de la medida" (medium); pole–zero →
  "casi se cancelan" (textbook "cancelación polo-cero", not named).
- "abismo abajo" → kept as one fixed phrase ("por el abismo abajo" unified). (medium)
- "mentirijillas" → "mentiritas" (Spain-only); https://es.wiktionary.org/wiki/mentirijilla
- Lap → "una vuelta (al lazo)" next to "ganancia del lazo", no textbook gloss ("lazo abierto" is
  ch01's open loop in the same section). (medium) ch10 uses "vuelta" only for rotation.
- "embalse" → "gran reserva de agua" (medium); "desbocar" → "desestabilizar"; "saltarín" kept.
- Rise over run → "tangente (lo que sube dividido entre lo que avanza)". (medium)
- Velocity / speed → "velocidad" is the term, "rapidez" only for plain magnitude; ch06 "rapidez
  de oscilación" → "velocidad de oscilación". (medium)
- ch04 "Con a positivo…, multiplicada por a"; "segunda ley de Newton" kept; "girador" first
  appears where defined; "trozos con denominador de primer grado"; σ_n → "n de *noise*, que en
  inglés significa ruido". Open for the maintainer: ch05's label could say "sen θ".

**it**
- Smoother → "smussatore", glossed once in ch10 "(nei libri, un sistema del primo ordine)";
  https://www.treccani.it/vocabolario/smussare/ (medium)
- Hunting → "pendolamento / pendolare" kept, glossed once "oscillazione permanente";
  https://www.treccani.it/vocabolario/pendolamento/
- Derivative kick → "calcio derivativo", glossed once with *derivative kick*; map `noise` "rumore
  e calcio". (medium)
- Chatter / jitter → split: "vibrazione / vibrare" (thrust, N) and "tremolio / tremolare"
  (sensor, cm); ch07's "wobble" preset → "ondulazione";
  https://www.treccani.it/vocabolario/tremolio/
- ch10 octave pun → "Ogni passo uguale è un *per* uguale, non un *più* uguale."
- Percent → "63%" with no space; compound units keep it ("0,60 %/(°C·s)");
  https://it.wikipedia.org/wiki/Simbolo_di_percentuale
- Lap → "giro (dell'anello)"; ch08 vocab adds "nei libri: la *funzione d'anello*";
  https://rocco.faculty.polimi.it/leonardo/lez8.pdf (medium)
- ch10 turn-back by ωL → "sfasamento" (the arrow "girata all'indietro" as the picture).
- Along/sideways → ch07 "parti orizzontali" → "parti in avanti"; "parte reale / immaginaria"
  from ch06.
- Rise over run → "pendenza (quanto sale fratto quanto avanza)". (medium)
- Drag → "attrito dell'aria" everywhere ("resistenza dell'aria" gone); "velocità" one word;
  "moltiplicata per a" and "integrazione per parti" kept; σ_n → "la n sta per l'inglese *noise*,
  rumore".

**de**
- Open loop → **Steuerung** (glossed once "offener Wirkungsablauf, engl. *open loop*"), closed
  loop Regelung / geschlossener Regelkreis; revises the settled decision above;
  https://de.wikipedia.org/wiki/Steuerungstechnik (medium)
- Starting from rest → the file wins; ch08's G(s) definition now says „bei Start aus der Ruhe".
- f(0) → „Anfangswert", f′(0) „Anfangsgeschwindigkeit", h(0) „Anfangshöhe"; ch09's default
  sliders are „Standardwerte".
- Smoother → „Glätter", glossed once „Fachwort: PT1-Glied" (TU Dresden booklet). (medium)
- Modes → „Modus / Modi" confirmed (*Eigenbewegung* is the whole free motion). (medium)
- ch09 „kein Fehler in unserer Einstellung" → rephrased; „Fehler" only means error.
- `ch11:widgets.mission.gold` → neutral „Das ist Regelungstechnik vom Feinsten."; map `you` keeps
  the paired form. (medium)
- HUD lengths („−180°-Tempo", „Pendelperiode", „Amplitudenreserve", „Spitze verlangt") → kept;
  readout chips wrap. (medium: screenshot at 375 px)
- Lap → „Runde (durch den Kreis)", glossed once „Übertragungsfunktion des offenen Kreises";
  „Kreisregel" → „charakteristische Gleichung (des Kreises)"; „hüpfig" kept. (medium)
- ch06 bridges „Realteil entlang, Imaginärteil seitlich"; vocab „Länge (Betrag)"; „Kaffeeregel"
  is used in ch03, ch04, ch06 and stays.
- Speed → „Tempo"; „Geschwindigkeit" only for velocity (ch05, ch10); drag always
  „Luftwiderstand" („Luftreibung" gone). (medium)
- dB → „Zehnerlogarithmus (lg)" (https://www.duden.de/rechtschreibung/Zehnerlogarithmus); σ_n →
  „n für engl. *noise*, Rauschen"; „partielle Integration" confirmed.

**pl**
- Cover-up trick → gloss „metoda przesłaniania" once;
  https://automatyka.kia.prz.edu.pl/attachments/article/9/Laplace-Matlab.pdf
- Ringing → „dzwonienie" kept; https://pl.wikipedia.org/wiki/Dzwonienie_(automatyka) (medium)
- Rule of thumb → „praktyczna reguła"; https://nowewyrazy.uw.edu.pl/haslo/regula-kciuka.html
- Thrust budget → „budżet ciągu" kept. (medium)
- Squashed ruler → gloss „skala logarytmiczna" once.
- „przebrane tłumienie" → „tłumienie w przebraniu" (ch10), „… w przebraniu" (ch11).
- „kop w tyłek" → kept; https://wsjp.pl/haslo/podglad/12088 (medium)
- Overshoot → *deliberate:* noun „przeregulowanie", verb „przestrzeliwać"; ch06's one
  „przeregulowuje" fixed.
- „{g} raza większe" → „pomnożone przez {g}" ({g} is often below 1).
- Ki unit → „niutony na metr i sekundę"; Kd „niutonosekundy na metr";
  https://www.gum.gov.pl/download/1/12937/6JednostkipochodneSIv2025.pdf
- Lap „okrążenie", „P od ang. *plant*, czyli obiekt", the along/sideways switch, „druga zasada
  dynamiki Newtona", „h prim / h bis", „tempo" → kept.
- Rise over run → „przyrost w pionie podzielony przez przyrost w poziomie".
- Speed / velocity → „szybkość / prędkość" where both appear (ch05).
- Mirror pair → „lustrzana para" (vocab gloss: para sprzężona); „Ten chwyt ma swoją nazwę:
  całkowanie przez części"; σ_n → „n od ang. *noise*, czyli szum".

**pt-BR**
- Coinages → orçamento de empuxo, empurrão inicial, suavizador, girador, "fica balançando" kept;
  "régua espremida" (medium) and "gambiarra" (medium) kept.
- Hunting → "caçar" dropped: "oscilar sem parar", HUD "período da oscilação";
  https://www.ece.ufrgs.br/~jmgomes/pid/Apostila/apostila/node42.html
- Side trip → "Parêntese"; "desvio" only for droop and "desvio padrão"; ch02 "o desvio residual".
- Maths decimals → `{,}` everywhere (40 numbers, ch01–ch09).
- `common:splane.settles` → "acomoda ≈ {t} s"; ch06 "assenta" → "acomoda".
- "playground", "checklist" → kept (VOLP foreign-word entries). (medium)
- Mismatches → the file wins: "o D da medição", "quase se cancelam".
- Loop gain → "ganho de malha" everywhere;
  https://www.feis.unesp.br/Home/departamentos/engenhariaeletrica/pos-graduacao/aula_12-16-04-2013.pdf
- Lap → "uma volta (pela malha)"; ch08 "O arrasto atrasa a volta em até 90°". (medium)
  "saltitante" kept.
- Along/sideways → ch07 "partes horizontais" → "partes ao longo". (medium)
- Rise over run → gloss "cateto oposto sobre cateto adjacente" once.
- "seta" everywhere ("flecha" gone); "arco tangente" kept (medium); "sin θ" labels, glossed once
  "sen θ"; velocity glossed once "velocidade vetorial"; "arrasto" in ch01 and ch03; ch07
  "denominadores"; "integração por partes"; σ_n → "n do inglês *noise*, ruído".

**ja**
- Register → plain style everywhere (です/ます removed from ch00, ch01, ch03, common).
- Knob → ノブ everywhere (ハンドル, つまみ gone).
- ch08 peak/overshoot `\text{}` → already ピーク / オーバーシュート;
  https://www.flight.t.u-tokyo.ac.jp/~tsuchiya/Control/14Response.pdf
- Dominant pole → 代表極; the recap says 親分（代表極）.
- Asked for / delivered → 指令値 / 実際の推力; ch09 指令の最大値 / 実際の最大値. (medium)
- Chatter / jitter → ばたつき / ゆらぎ; ガタガタ, ざわつき, ぶれる gone; ふらつき only for wobble;
  https://hi-ctrl.hatenablog.com/entry/2018/02/25/020939 (medium)
- Smoother → なまし（一次遅れ） kept. (medium)
- Cover-up trick → 指で隠す技（カバーアップ法）. (medium)
- ch07 full read → consistent; small clarity fixes (速度 → 速さ for rates). (medium)
- Percent → "25%" with no space in prose.
- Double dot → 1つの点に重なる（重根）; bouncy → 跳ねる / 跳ねやすい (medium); lap 1周, glossed once
  一巡伝達関数; spinner 回転子 everywhere.
- Mirror twin 鏡像の双子 / 鏡像のペア only; アークタンジェント（逆正接） kept.
- Primes → プライム, glossed once 学校では「ダッシュ」.
- Speed → *deliberate split:* the drone's signed speed 速度, rates 速さ. (medium)
- ch05 axes → たて (wrong: it is horizontal) → まえ / よこ. (medium)
- Squashed ruler → つぶしたものさし everywhere; σ_n → nはノイズ（noise）のn; spring ばね everywhere.

**zh-CN**
- termonline could not be queried without a login; mainland textbooks and course notes settled
  the terms instead.
- Bode plot → 伯德图, glossed once 也常写作波特图; https://ai.yitsd.edu.cn/di5zhang5.1he5.2.pdf
- Hunting → 等幅振荡 (HUD 等幅振荡周期), glossed once; https://zhuanlan.zhihu.com/p/716747582 (medium)
- Chatter / jitter → 抖动 for both (乱颤 gone); ordinary wiggle → 晃动. (medium)
- Clipping → 限幅; ch08's "20 N limit" → 电机限制.
- Cover-up trick → 掩盖法 (first use 赫维赛德掩盖法). (medium)
- Mirror → 镜像孪生 (twin) and 镜像对 (pair); 镜像双胞胎 / 镜像伙伴 gone.
- Length / angle → 模 / 辐角 named once after 长度 / 角度.
- ch05 along/sideways → 沿轴 / 侧向 (the 纵向 / 横向 labels were wrong); shadow 影子 (投影 named
  once); rim 边缘.
- Map `closedloop` → 回路闭合; loop word 回路 everywhere (环路 gone). (medium)
- Lap 绕回路一圈 / 一圈 kept (medium); 重根点, 爱弹跳, 牛顿第二定律, 分部积分 kept.
- Speed → 速度 one word (速率 only for "rate"). (medium) σ_n → n 取自英文 noise（噪声）.

**ar**
- Numerals → Western 0–9, `.` decimal point, `%` with no space; https://www.w3.org/TR/alreq/
  (medium)
- المُنعِّم (medium), المسطرة المضغوطة, "هامش الطور تخميدٌ متنكر" (medium), ركلة المشتقة (medium) →
  kept.
- ch10 `\frac{1}{i\omega}: …` → Arabic `\text{}` reordered to read left to right. (medium: check
  in the browser)
- ch01 recap chain → ← in right-to-left prose, as ch10.
- Slider units → بالنيوتن لكل متر ثانية (Ki), بالنيوتن ثانية لكل متر (Kd, c); prose keeps the symbol
  forms. (medium)
- Radian → labels راديان/ث, prose راديان/ثانية.
- Wiggle → one family: تذبذب / تذبذبة / يتذبذب, wiggle speed سرعة التذبذب; اهتزاز only for sensor
  jitter. (medium)
- Gust → هبّة (هبّة ريح); https://www.windy.com/ar/-هبّات-الرياح-gust
- Lap → لفّة kept (medium); the knob's turns are حركات المقبض.
- ch05 along/sideways → الأفقي / الجانبي; arctan قوس الظل kept
  (https://ar.wikipedia.org/wiki/دوال_مثلثية_عكسية).
- Primes → الشَّرطات kept; the conjugate bar is الخط العلوي. (medium)
- Spinner → الدوّار (المغزل and السهم الدوار gone); velocity السرعة المتجهة; piece جزء
  (*deliberate:* قطعة for area bits and Fourier pieces); drag مقاومة الهواء (قوة السحب gone).
- ∫ "S for sum", σ_n "n من noise" and التكامل بالتجزئة → kept.

## Still for a native reviewer

Medium-confidence decisions from the 2026-09-27 review:

- fr: « lisseur »; « main vitesse / main position »; « vitesse à −180° / à gain 1 »; « bobards ».
- es: "D a partir de la medida"; HUD "periodo en el borde" at 375 px; "abismo abajo".
- es: "una vuelta (al lazo)" without a textbook gloss; "gran reserva de agua".
- es: rise over run as "lo que sube dividido entre lo que avanza"; "velocidad" vs. "rapidez".
- it: "smussatore"; "calcio derivativo"; "funzione d'anello" gloss; "pendenza (… fratto …)".
- de: „Steuerung" / „Regelung" as the open/closed-loop terms; „Glätter (PT1-Glied)"; „Modi".
- de: neutral `mission.gold`; HUD lengths at 375 px; „Runde" / „hüpfig"; „Tempo" vs.
  „Geschwindigkeit".
- pl: „dzwonienie"; „budżet ciągu"; „kop w tyłek".
- pt-BR: "régua espremida"; "gambiarra"; "playground" / "checklist"; "uma volta (pela malha)".
- pt-BR: ch07 "partes ao longo"; "arco tangente".
- ja: 指令値 / 実際の推力; ばたつき / ゆらぎ; なまし; 指で隠す技; the ch07 fixes; 跳ねやすい.
- ja: 速度 / 速さ split; ch05 axis labels まえ / よこ; the along/sideways switch.
- zh-CN: 等幅振荡; 抖动 for noise with 晃动 for wiggle; 掩盖法; 回路闭合 / 回路; lap 一圈; one 速度.
- ar: Western numerals; المُنعِّم; "تخميدٌ متنكر"; ركلة المشتقة; the ch10 formula order.
- ar: slider unit wording; the تذبذب / اهتزاز split; لفّة; الشَّرطات.

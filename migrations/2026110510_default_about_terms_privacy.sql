-- UNA-Migration-Min-System-Version: 15.0.0-RC3
-- Default texts of the About, Terms of Service and Privacy Policy pages (the sys_about, sys_terms
-- and sys_privacy blocks) in English and Russian. Each string changes only while it still has the
-- old one-line default, so text an operator has written is left alone. About got its text in
-- #6086, before migrations existed, so sites installed earlier still have the old line.

UPDATE `sys_localization_strings` AS `s`
INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
SET `s`.`String` = '<p>Welcome! This is a community for people who want to meet others with similar interests, share what they know and keep in touch.</p>
<p>Members set up a profile, post news, photos and links, comment on each other''s posts and follow the people and topics they care about. Anyone can look around. To post, comment or message other members, sign up for an account.</p>
<p>To keep this a good place for everyone, we ask members to:</p>
<ul>
<li>be respectful, especially when they disagree;</li>
<li>share only what they have the right to share;</li>
<li>keep other people''s private information private;</li>
<li>report anything that breaks these rules, so moderators can deal with it.</li>
</ul>
<p>The full rules are in our Terms of Service, and our Privacy Policy explains how we handle your data.</p>
<p>This site is <a href="https://unacms.com">powered by UNA CMS platform</a>, open-source software for building online communities and social networks.</p>'
WHERE `k`.`Key` = '_sys_page_lang_block_about' AND `l`.`Name` = 'en' AND `s`.`String` = 'This site is powered by UNA. The rest is a mystery.';

UPDATE `sys_localization_strings` AS `s`
INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
SET `s`.`String` = '<p>Добро пожаловать! Это сообщество для тех, кто хочет находить людей со схожими интересами, делиться знаниями и оставаться на связи.</p>
<p>Участники заполняют профиль, публикуют новости, фото и ссылки, комментируют записи друг друга и подписываются на интересных им людей и темы. Смотреть сайт может любой. Чтобы публиковать, комментировать и писать другим участникам, зарегистрируйтесь.</p>
<p>Чтобы здесь было хорошо всем, мы просим участников:</p>
<ul>
<li>уважать друг друга, особенно в спорах;</li>
<li>публиковать только то, на что у них есть права;</li>
<li>не раскрывать чужие личные данные;</li>
<li>сообщать о нарушениях этих правил, чтобы модераторы могли разобраться.</li>
</ul>
<p>Полностью правила изложены в Правилах пользования, а как мы обращаемся с вашими данными, описано в Политике конфиденциальности.</p>
<p>Сайт <a href="https://unacms.com">работает на платформе UNA CMS</a> с открытым исходным кодом для создания онлайн-сообществ и социальных сетей.</p>'
WHERE `k`.`Key` = '_sys_page_lang_block_about' AND `l`.`Name` = 'ru' AND `s`.`String` = 'Этот сайт сделан на UNA. Остальное - тайна, покрытая мраком.';

UPDATE `sys_localization_strings` AS `s`
INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
SET `s`.`String` = '<p><em>Note for the site operator: this is a starting template, not legal advice. Fill in the parts in square brackets, adapt the rest to your site and to the laws that apply to you, have a lawyer review it where needed, and then delete this note.</em></p>
<h3>About these terms</h3>
<p>These terms apply to everyone who visits or uses {site_title} (the "site"). By using the site or signing up for an account, you agree to them. If you do not agree, please do not use the site.</p>
<h3>Who runs this site</h3>
<p>{site_title} is run by [the name of the person or organisation that runs the site] ("we", "us"), its operator. We set these terms, decide how they apply and enforce them.</p>
<p>The site is built with UNA, open-source community software made by UNA, Inc. UNA, Inc. does not run this site, is not a party to these terms and has no control over them, over what is posted here or over how we enforce them. Send questions and complaints about the site to us, not to UNA, Inc.</p>
<h3>Your account</h3>
<ul>
<li>You must be at least [minimum age] years old to sign up.</li>
<li>Give accurate information when you sign up and keep it up to date.</li>
<li>Keep your password safe. You are responsible for what happens in your account, so tell us straight away if you think someone else has used it.</li>
<li>Do not create an account for someone else without their permission.</li>
</ul>
<h3>Your content</h3>
<p>You keep the rights to what you post. By posting it, you let us store it, show it to the audience you choose and make the copies that running the site needs. This permission ends when you delete the content or your account, apart from copies that other members have already shared and copies we must keep for a limited time, such as backups.</p>
<p>You are responsible for what you post. Post only what you have the right to share.</p>
<h3>Rules</h3>
<p>When you use the site, do not:</p>
<ul>
<li>break the law, or help or encourage others to break it;</li>
<li>harass, threaten or bully anyone, or attack people for who they are;</li>
<li>share other people''s private information without their consent;</li>
<li>post content that infringes someone else''s copyright, trademark or other rights;</li>
<li>post anything that sexualises or exploits children;</li>
<li>send spam, run scams or pretend to be someone else;</li>
<li>upload malware, try to get into accounts or areas you are not allowed to use, collect other members'' data without their consent, or disrupt the site.</li>
</ul>
<p>[Add any rules that are specific to your community.]</p>
<h3>Moderation</h3>
<p>We may review, hide or remove content, and limit, suspend or close accounts that break these terms or put the site or other people at risk. Where we can, we will tell you what we did and why. To report content or a member, use the Report option on the site or contact us.</p>
<h3>Paid features</h3>
<p>If the site offers paid memberships or other paid features, the price, what you get and how to cancel are shown before you pay. [Add your payment, renewal, cancellation and refund terms, or delete this section if the site has nothing paid.]</p>
<h3>Other people''s content and other sites</h3>
<p>Content posted by members belongs to them and does not necessarily reflect our views. Links to other websites are provided for convenience. We are not responsible for those websites.</p>
<h3>Closing your account</h3>
<p>You can stop using the site at any time and delete your account in your account settings. We may close an account as described under Moderation.</p>
<h3>No warranty and limits of liability</h3>
<p>We provide the site "as is" and "as available". We work to keep it running and safe, but we cannot promise that it will always be available, free of errors or secure. As far as the law allows, we are not liable for indirect losses or for losses caused by other members'' content or actions. Nothing in these terms takes away rights that the law gives you and that cannot be waived.</p>
<h3>Changes to these terms</h3>
<p>We may update these terms. The current version is always on this page, with the date it was last changed. If a change is significant, we will tell members before it takes effect, for example on the site or by email. If you keep using the site after a change takes effect, you accept the updated terms.</p>
<h3>Applicable law</h3>
<p>[State which country''s or state''s law governs these terms and where disputes are settled.]</p>
<h3>Contact</h3>
<p>For questions about these terms, contact us at [an email address, a postal address or a link to your contact page].</p>
<p>Last updated: [date].</p>'
WHERE `k`.`Key` = '_sys_page_lang_block_terms' AND `l`.`Name` = 'en' AND `s`.`String` = 'Our terms of use.';

UPDATE `sys_localization_strings` AS `s`
INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
SET `s`.`String` = '<p><em>Примечание для владельца сайта: это шаблон для начала работы, а не юридическая консультация. Заполните места в квадратных скобках, измените остальное под свой сайт и законы, которые к вам применяются, при необходимости покажите текст юристу, а затем удалите это примечание.</em></p>
<h3>Об этих правилах</h3>
<p>Эти правила действуют для всех, кто заходит на {site_title} (далее «сайт») или пользуется им. Пользуясь сайтом или регистрируясь на нём, вы соглашаетесь с ними. Если вы не согласны, пожалуйста, не пользуйтесь сайтом.</p>
<h3>Кто управляет сайтом</h3>
<p>Сайтом {site_title} управляет [имя человека или название организации, которые управляют сайтом] (далее «мы»). Мы устанавливаем эти правила, решаем, как они применяются, и следим за их соблюдением.</p>
<p>Сайт сделан на UNA — программе с открытым исходным кодом для сообществ, которую разрабатывает UNA, Inc. UNA, Inc. не управляет этим сайтом, не является стороной этих правил и не контролирует ни их, ни то, что здесь публикуется, ни то, как мы их применяем. Вопросы и жалобы о сайте направляйте нам, а не UNA, Inc.</p>
<h3>Ваша учётная запись</h3>
<ul>
<li>Для регистрации вам должно быть не меньше [минимальный возраст] лет.</li>
<li>Указывайте при регистрации верные данные и поддерживайте их в актуальном состоянии.</li>
<li>Храните пароль в тайне. Вы отвечаете за то, что происходит в вашей учётной записи, поэтому сразу сообщите нам, если думаете, что ею воспользовался кто-то другой.</li>
<li>Не создавайте учётную запись за другого человека без его разрешения.</li>
</ul>
<h3>Ваши материалы</h3>
<p>Права на то, что вы публикуете, остаются за вами. Публикуя материал, вы разрешаете нам хранить его, показывать выбранной вами аудитории и делать копии, которые нужны для работы сайта. Это разрешение прекращается, когда вы удаляете материал или учётную запись, кроме копий, которыми уже поделились другие участники, и копий, которые мы должны хранить ограниченное время, например резервных.</p>
<p>Вы отвечаете за то, что публикуете. Публикуйте только то, чем имеете право делиться.</p>
<h3>Правила поведения</h3>
<p>На сайте запрещено:</p>
<ul>
<li>нарушать закон, помогать в этом другим или подталкивать их к этому;</li>
<li>преследовать, запугивать и травить людей или нападать на них из-за того, кто они;</li>
<li>раскрывать чужие личные данные без согласия их владельца;</li>
<li>публиковать материалы, нарушающие чужие авторские права, права на товарные знаки и другие права;</li>
<li>публиковать что-либо, что сексуализирует детей или эксплуатирует их;</li>
<li>рассылать спам, мошенничать и выдавать себя за другого человека;</li>
<li>загружать вредоносные программы, пытаться попасть в чужие учётные записи и закрытые разделы, собирать данные других участников без их согласия или мешать работе сайта.</li>
</ul>
<p>[Добавьте правила, которые нужны именно вашему сообществу.]</p>
<h3>Модерация</h3>
<p>Мы можем проверять, скрывать и удалять материалы, а также ограничивать, приостанавливать и закрывать учётные записи, которые нарушают эти правила или создают угрозу сайту и другим людям. Когда это возможно, мы сообщим, что сделали и почему. Чтобы пожаловаться на материал или участника, воспользуйтесь кнопкой «Пожаловаться» на сайте или свяжитесь с нами.</p>
<h3>Платные функции</h3>
<p>Если на сайте есть платные уровни участия или другие платные функции, цена, состав и порядок отмены показываются до оплаты. [Опишите условия оплаты, продления, отмены и возврата денег или удалите этот раздел, если на сайте нет ничего платного.]</p>
<h3>Чужие материалы и другие сайты</h3>
<p>Материалы участников принадлежат их авторам и не обязательно отражают наше мнение. Ссылки на другие сайты даны для удобства. Мы не отвечаем за эти сайты.</p>
<h3>Удаление учётной записи</h3>
<p>Вы можете в любой момент перестать пользоваться сайтом и удалить учётную запись в её настройках. Мы можем закрыть учётную запись, как описано в разделе «Модерация».</p>
<h3>Отказ от гарантий и ограничение ответственности</h3>
<p>Мы предоставляем сайт «как есть» и «по мере доступности». Мы стараемся, чтобы он работал и был безопасным, но не можем обещать, что он всегда будет доступен, без ошибок и в безопасности. В той мере, в какой это допускает закон, мы не отвечаем за косвенные убытки и за убытки от материалов и действий других участников. Эти правила не лишают вас прав, которые даёт вам закон и от которых нельзя отказаться.</p>
<h3>Изменения правил</h3>
<p>Мы можем обновлять эти правила. Действующая версия всегда находится на этой странице вместе с датой последнего изменения. О существенных изменениях мы сообщим участникам до того, как они вступят в силу, например на сайте или по электронной почте. Если вы продолжаете пользоваться сайтом после вступления изменений в силу, вы принимаете обновлённые правила.</p>
<h3>Применимое право</h3>
<p>[Укажите, законы какой страны или штата применяются к этим правилам и где рассматриваются споры.]</p>
<h3>Контакты</h3>
<p>С вопросами об этих правилах обращайтесь к нам: [адрес электронной почты, почтовый адрес или ссылка на страницу контактов].</p>
<p>Последнее обновление: [дата].</p>'
WHERE `k`.`Key` = '_sys_page_lang_block_terms' AND `l`.`Name` = 'ru' AND `s`.`String` = 'Правила пользования нашим сайтом.';

UPDATE `sys_localization_strings` AS `s`
INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
SET `s`.`String` = '<p><em>Note for the site operator: this is a starting template, not legal advice. List what your site actually collects and the services you actually use, fill in the parts in square brackets, have a lawyer check it against the laws that apply to you, and then delete this note.</em></p>
<h3>Who is responsible for your data</h3>
<p>{site_title} (the "site") is run by [the name of the person or organisation that runs the site] ("we", "us"), its operator. We decide what personal data the site collects, why and for how long, and we are responsible for it. Some laws call this role the data controller.</p>
<p>The site is built with UNA, open-source community software made by UNA, Inc. UNA, Inc. does not run this site. Collecting, using and storing personal data here is entirely at our discretion and under our control, not UNA, Inc.''s. Send questions and requests about your data to us.</p>
<h3>What we collect</h3>
<ul>
<li><strong>Account details:</strong> your email address and password, and a phone number if you add one. We do not store your password in readable form.</li>
<li><strong>Profile and content:</strong> your profile details and pictures, and what you post, comment, react to, follow or join. Who can see each item depends on the privacy settings you choose.</li>
<li><strong>Messages:</strong> private messages are stored on the site''s servers so they can be delivered.</li>
<li><strong>Usage and device data:</strong> the pages you open and the actions you take, with the time, your IP address, browser, device type and language. Our servers also keep logs of requests and errors.</li>
<li><strong>Cookies and local storage:</strong> a cookie keeps you signed in, and others remember settings such as language and theme. If you use our mobile app and allow notifications, we keep a device token to send them. [List any analytics, advertising or other third-party services you add, and the cookies they set.]</li>
<li><strong>Payments:</strong> if you buy something on the site, a payment provider handles the payment. We get a confirmation, not your full card details. [Delete this item if the site has nothing paid.]</li>
<li><strong>From other people:</strong> other members may mention you, tag you or invite you by email.</li>
</ul>
<h3>Why we use it</h3>
<ul>
<li>to run your account and show your content to the audience you chose;</li>
<li>to send you emails and notifications about your account and activity, which you can turn off in your settings, except for essential ones such as password resets;</li>
<li>to send you news about the site, only if you agreed to receive it;</li>
<li>to keep the site safe: to stop spam, abuse and fraud and to handle reports;</li>
<li>to understand how the site is used and improve it;</li>
<li>to meet our legal obligations.</li>
</ul>
<p>Where the law requires a legal basis for using personal data, we rely on our agreement with you (the Terms of Service), our legitimate interest in running a safe and useful site, your consent (which you can withdraw at any time), and our legal obligations. [Check which of these apply to you under your laws.]</p>
<h3>Who can see it</h3>
<ul>
<li><strong>Other members and visitors</strong> see your profile and posts as your privacy settings allow.</li>
<li><strong>Service providers</strong> that help us run the site, such as hosting, storage, email delivery and payment providers, process data for us and only to provide their service. [List them.]</li>
<li><strong>Authorities</strong> get data when the law requires it, or when it is needed to protect someone''s rights or safety.</li>
<li><strong>A new operator</strong> gets the data if the site is transferred to someone else, and this policy continues to apply.</li>
</ul>
<p>We do not sell your personal data. [If you share data for advertising or other purposes, describe that here instead.]</p>
<p>Our servers and service providers may be in countries other than yours. [Say where they are and how data sent there is protected.]</p>
<h3>How long we keep it</h3>
<p>We keep your account data and content for as long as your account exists. When you delete your account, we delete your profile and delete or anonymise your content within [period], apart from what the law requires us to keep. Copies in backups are deleted within [period]. Server logs are kept for [period].</p>
<h3>Your rights</h3>
<ul>
<li><strong>Access and copy:</strong> you can ask us what data we hold about you and for a copy of it.</li>
<li><strong>Correction:</strong> you can correct most of your data yourself in your profile and account settings, or ask us to.</li>
<li><strong>Deletion:</strong> you can delete your content, or your whole account in your account settings.</li>
<li><strong>Objection and consent:</strong> you can object to some uses of your data and withdraw any consent you gave, for example by unsubscribing from emails.</li>
</ul>
<p>To use these rights, contact us. We may need to confirm your identity first. Depending on where you live, you may also be able to complain to your data protection authority.</p>
<h3>Security</h3>
<p>We take reasonable steps to protect your data, such as limiting who can access it. No system is completely secure, so we cannot guarantee it. Use a strong password that you do not use anywhere else. If a breach affects your data, we will tell you where the law requires us to.</p>
<h3>Children</h3>
<p>The site is not meant for children under [minimum age]. We do not knowingly collect their data. If you believe a child has given us personal data, contact us and we will delete it.</p>
<h3>Changes to this policy</h3>
<p>We may update this policy. The current version is always on this page, with the date it was last changed. If a change is significant, we will tell members before it takes effect, for example on the site or by email.</p>
<h3>Contact</h3>
<p>For questions or requests about your data, contact us at [an email address, a postal address or a link to your contact page]. [Add your data protection officer or representative, if you have one.]</p>
<p>Last updated: [date].</p>'
WHERE `k`.`Key` = '_sys_page_lang_block_privacy' AND `l`.`Name` = 'en' AND `s`.`String` = 'Our privacy policy.';

UPDATE `sys_localization_strings` AS `s`
INNER JOIN `sys_localization_keys` AS `k` ON `k`.`ID` = `s`.`IDKey`
INNER JOIN `sys_localization_languages` AS `l` ON `l`.`ID` = `s`.`IDLanguage`
SET `s`.`String` = '<p><em>Примечание для владельца сайта: это шаблон для начала работы, а не юридическая консультация. Перечислите, что на самом деле собирает ваш сайт и какими сервисами вы пользуетесь, заполните места в квадратных скобках, попросите юриста проверить текст на соответствие законам, которые к вам применяются, а затем удалите это примечание.</em></p>
<h3>Кто отвечает за ваши данные</h3>
<p>Сайтом {site_title} (далее «сайт») управляет [имя человека или название организации, которые управляют сайтом] (далее «мы»). Мы решаем, какие персональные данные собирает сайт, зачем и как долго их хранить, и отвечаем за них. В некоторых законах эта роль называется оператором или контролёром данных.</p>
<p>Сайт сделан на UNA — программе с открытым исходным кодом для сообществ, которую разрабатывает UNA, Inc. UNA, Inc. не управляет этим сайтом. Сбор, использование и хранение персональных данных здесь полностью зависят от нашего решения и находятся под нашим контролем, а не под контролем UNA, Inc. Вопросы и запросы о ваших данных направляйте нам.</p>
<h3>Что мы собираем</h3>
<ul>
<li><strong>Данные учётной записи:</strong> адрес электронной почты и пароль, а также номер телефона, если вы его добавите. Мы не храним пароль в читаемом виде.</li>
<li><strong>Профиль и материалы:</strong> данные и фотографии профиля, а также то, что вы публикуете, комментируете, оцениваете, на что подписываетесь и куда вступаете. Кто видит каждый материал, зависит от выбранных вами настроек приватности.</li>
<li><strong>Сообщения:</strong> личные сообщения хранятся на серверах сайта, чтобы их можно было доставить.</li>
<li><strong>Данные об использовании и устройстве:</strong> какие страницы вы открываете и что делаете, а также время, IP-адрес, браузер, тип устройства и язык. Наши серверы также ведут журналы запросов и ошибок.</li>
<li><strong>Cookies и локальное хранилище:</strong> один cookie сохраняет вход на сайт, другие запоминают настройки, например язык и тему. Если вы пользуетесь нашим мобильным приложением и разрешили уведомления, мы храним токен устройства, чтобы их отправлять. [Перечислите сервисы аналитики, рекламы и другие сторонние сервисы, которые вы подключили, и cookies, которые они ставят.]</li>
<li><strong>Платежи:</strong> если вы что-то покупаете на сайте, оплату обрабатывает платёжный сервис. Мы получаем подтверждение оплаты, а не полные данные карты. [Удалите этот пункт, если на сайте нет ничего платного.]</li>
<li><strong>От других людей:</strong> другие участники могут упомянуть вас, отметить или пригласить по электронной почте.</li>
</ul>
<h3>Зачем мы их используем</h3>
<ul>
<li>чтобы ваша учётная запись работала, а ваши материалы видела выбранная вами аудитория;</li>
<li>чтобы отправлять письма и уведомления о вашей учётной записи и активности; их можно отключить в настройках, кроме обязательных, например для сброса пароля;</li>
<li>чтобы присылать новости сайта, только если вы согласились их получать;</li>
<li>чтобы сайт оставался безопасным: бороться со спамом, злоупотреблениями и мошенничеством и разбирать жалобы;</li>
<li>чтобы понимать, как пользуются сайтом, и улучшать его;</li>
<li>чтобы выполнять требования закона.</li>
</ul>
<p>Если закон требует правового основания для обработки персональных данных, мы опираемся на соглашение с вами (Правила пользования), наш законный интерес в том, чтобы сайт был безопасным и полезным, ваше согласие (его можно отозвать в любой момент) и обязанности, которые возлагает на нас закон. [Проверьте, какие из этих оснований применимы по вашим законам.]</p>
<h3>Кто может их видеть</h3>
<ul>
<li><strong>Другие участники и посетители</strong> видят ваш профиль и публикации в пределах ваших настроек приватности.</li>
<li><strong>Сервисы, которые помогают нам вести сайт,</strong> например хостинг, хранилище файлов, отправка писем и приём платежей, обрабатывают данные по нашему поручению и только для оказания своих услуг. [Перечислите их.]</li>
<li><strong>Государственные органы</strong> получают данные, когда этого требует закон или когда это нужно для защиты чьих-то прав и безопасности.</li>
<li><strong>Новый владелец</strong> получает данные, если сайт перейдёт к кому-то другому, и эта политика продолжит действовать.</li>
</ul>
<p>Мы не продаём ваши персональные данные. [Если вы передаёте данные для рекламы или других целей, опишите это здесь.]</p>
<p>Наши серверы и сервисы могут находиться в других странах. [Укажите, где они находятся и как защищены данные, которые туда передаются.]</p>
<h3>Как долго мы их храним</h3>
<p>Данные учётной записи и материалы хранятся, пока существует учётная запись. Когда вы удаляете учётную запись, мы удаляем профиль и удаляем или обезличиваем ваши материалы в течение [срок], кроме того, что обязаны хранить по закону. Копии в резервных копиях удаляются в течение [срок]. Журналы серверов хранятся [срок].</p>
<h3>Ваши права</h3>
<ul>
<li><strong>Доступ и копия:</strong> вы можете узнать у нас, какие данные о вас мы храним, и получить их копию.</li>
<li><strong>Исправление:</strong> большую часть данных можно исправить самостоятельно в настройках профиля и учётной записи или попросить об этом нас.</li>
<li><strong>Удаление:</strong> вы можете удалить свои материалы или всю учётную запись в её настройках.</li>
<li><strong>Возражение и согласие:</strong> вы можете возразить против некоторых способов использования данных и отозвать данное согласие, например отписавшись от рассылки.</li>
</ul>
<p>Чтобы воспользоваться этими правами, свяжитесь с нами. Сначала нам может понадобиться подтвердить вашу личность. В зависимости от того, где вы живёте, вы также можете подать жалобу в орган по защите персональных данных.</p>
<h3>Безопасность</h3>
<p>Мы принимаем разумные меры для защиты ваших данных, например ограничиваем круг людей, у которых есть к ним доступ. Полностью защищённых систем не бывает, поэтому мы не можем этого гарантировать. Используйте надёжный пароль, который вы больше нигде не используете. Если утечка затронет ваши данные, мы сообщим вам, когда этого требует закон.</p>
<h3>Дети</h3>
<p>Сайт не предназначен для детей младше [минимальный возраст] лет. Мы сознательно не собираем их данные. Если вы считаете, что ребёнок передал нам персональные данные, свяжитесь с нами, и мы их удалим.</p>
<h3>Изменения политики</h3>
<p>Мы можем обновлять эту политику. Действующая версия всегда находится на этой странице вместе с датой последнего изменения. О существенных изменениях мы сообщим участникам до того, как они вступят в силу, например на сайте или по электронной почте.</p>
<h3>Контакты</h3>
<p>С вопросами и запросами о ваших данных обращайтесь к нам: [адрес электронной почты, почтовый адрес или ссылка на страницу контактов]. [Добавьте контакты ответственного за защиту данных или представителя, если они есть.]</p>
<p>Последнее обновление: [дата].</p>'
WHERE `k`.`Key` = '_sys_page_lang_block_privacy' AND `l`.`Name` = 'ru' AND `s`.`String` = 'Политика конфиденциальности нашего сайта.';

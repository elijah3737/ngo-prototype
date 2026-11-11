<?php
// Образец. На хостинге скопировать в send-config.php и заполнить. Пароль — только там и в .env проекта, не в git.
return [
  'to'        => 'info@ngo.group',        // куда приходят заявки (можно несколько через запятую)
  'from'      => 'info@ngo.group',        // отправитель; при SMTP — тот же ящик, что smtp_user
  // SMTP Mail.ru (VK WorkSpace): пароль приложения ящика. Пусто — отправка через PHP mail() хостинга.
  'smtp_host' => 'smtp.mail.ru',
  'smtp_port' => 465,
  'smtp_user' => '',
  'smtp_pass' => '',
];

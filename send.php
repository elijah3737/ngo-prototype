<?php
// Приём заявок с форм сайта NGO (form[data-tz]) → письмо с вложениями.
// Настройки — send-config.php рядом (образец send-config.sample.php; не в git, не в выгрузке GitHub Pages).
// Отправка: SMTP (smtp.mail.ru:465, implicit TLS, From = сам ящик), если в конфиге задан smtp_user; иначе PHP mail().
// Лог — send.log рядом (закрыт .htaccess): время, страница, результат, без персональных данных.

header('Content-Type: application/json; charset=utf-8');
$cfgFile = __DIR__ . '/send-config.php';
if (!is_file($cfgFile)) { http_response_code(500); echo json_encode(['ok' => false, 'error' => 'config']); exit; }
$cfg = require $cfgFile;

function out($ok, $code = 200, $err = '') { http_response_code($code); echo json_encode(['ok' => $ok, 'error' => $err]); exit; }
function logline($s) { @file_put_contents(__DIR__ . '/send.log', date('c') . ' ' . $s . "\n", FILE_APPEND | LOCK_EX); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(false, 405, 'method');
if (!empty($_POST['website'])) out(true);                         // honeypot: бот — делаем вид, что ок
if ((int)($_POST['t'] ?? 0) < 3) out(true);                        // форма заполнена быстрее 3 с — бот

// простой лимит: не больше 5 заявок с IP за 10 минут
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$rl = sys_get_temp_dir() . '/ngo_rl_' . md5($ip);
$hits = array_filter(explode(',', (string)@file_get_contents($rl)), fn($t) => $t > time() - 600);
if (count($hits) >= 5) out(false, 429, 'rate');
$hits[] = time(); @file_put_contents($rl, implode(',', $hits));

$fields = json_decode($_POST['fields'] ?? '[]', true);
if (!is_array($fields) || !$fields) out(false, 400, 'empty');
$page = mb_substr(strip_tags($_POST['page'] ?? ''), 0, 300);
$rows = [];
foreach ($fields as $f) {
  $k = mb_substr(trim(strip_tags($f['k'] ?? '')), 0, 100);
  $v = mb_substr(trim(strip_tags($f['v'] ?? '')), 0, 5000);
  if ($k !== '' && $v !== '') $rows[] = [$k, $v];
}
if (!$rows) out(false, 400, 'empty');

// вложения: до 10 МБ суммарно, только документы и картинки
$allowed = ['pdf','doc','docx','xls','xlsx','csv','txt','rtf','odt','ods','jpg','jpeg','png','webp','heic','dwg','dxf','zip','rar','7z'];
$atts = []; $total = 0;
if (!empty($_FILES['files']['name'])) {
  foreach ((array)$_FILES['files']['name'] as $i => $name) {
    if ($_FILES['files']['error'][$i] !== UPLOAD_ERR_OK) continue;
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed, true)) continue;
    $total += $_FILES['files']['size'][$i];
    if ($total > 10 * 1024 * 1024) out(false, 413, 'size');
    $atts[] = [basename($name), file_get_contents($_FILES['files']['tmp_name'][$i])];
  }
}

$h = fn($s) => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');
$html = '<h2>Заявка с сайта ngo.group</h2><table cellpadding="6" border="1" style="border-collapse:collapse">';
foreach ($rows as [$k, $v]) $html .= '<tr><td><b>' . $h($k) . '</b></td><td>' . nl2br($h($v)) . '</td></tr>';
$html .= '<tr><td><b>Страница</b></td><td>' . $h($page) . '</td></tr></table>';
if ($atts) $html .= '<p>Вложений: ' . count($atts) . '</p>';

$from = $cfg['from'];
$to = $cfg['to'];
$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . ($rows[0][1] ?? '')) . '?=';
$b = '=_ngo_' . bin2hex(random_bytes(8));
$headers = "From: =?UTF-8?B?" . base64_encode('Сайт НГО') . "?= <$from>\r\nTo: $to\r\nSubject: $subject\r\nDate: " . date('r')
  . "\r\nMessage-ID: <" . bin2hex(random_bytes(8)) . "@ngo.group>\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary=\"$b\"";
$body = "--$b\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($html));
foreach ($atts as [$n, $data]) {
  $body .= "--$b\r\nContent-Type: application/octet-stream; name=\"=?UTF-8?B?" . base64_encode($n) . "?=\"\r\nContent-Transfer-Encoding: base64\r\n"
    . "Content-Disposition: attachment; filename=\"=?UTF-8?B?" . base64_encode($n) . "?=\"\r\n\r\n" . chunk_split(base64_encode($data));
}
$body .= "--$b--\r\n";

function smtp_send($cfg, $from, $to, $headers, $body, &$err) {
  $verify = $cfg['smtp_verify'] ?? true;   // false — только для локального теста с самоподписанным сертификатом
  $ctx = stream_context_create(['ssl' => ['verify_peer' => $verify, 'verify_peer_name' => $verify]]);
  $s = @stream_socket_client('tls://' . $cfg['smtp_host'] . ':' . $cfg['smtp_port'], $en, $es, 20, STREAM_CLIENT_CONNECT, $ctx);
  if (!$s) { $err = "connect $es"; return false; }
  $read = function () use ($s) { $r = ''; while (($l = fgets($s, 1024)) !== false) { $r .= $l; if (isset($l[3]) && $l[3] === ' ') break; } return $r; };
  $cmd = function ($c, $want) use ($s, $read, &$err) { if ($c !== null) fwrite($s, $c . "\r\n"); $r = $read(); if ((int)substr($r, 0, 3) !== $want) { $err = trim($r); return false; } return true; };
  $ok = $cmd(null, 220) && $cmd('EHLO ngo.group', 250) && $cmd('AUTH LOGIN', 334)
    && $cmd(base64_encode($cfg['smtp_user']), 334) && $cmd(base64_encode($cfg['smtp_pass']), 235)
    && $cmd("MAIL FROM:<$from>", 250);
  foreach (array_map('trim', explode(',', $to)) as $rcpt) $ok = $ok && $cmd("RCPT TO:<$rcpt>", 250);
  $ok = $ok && $cmd('DATA', 354) && $cmd($headers . "\r\n\r\n" . preg_replace('/^\./m', '..', $body) . "\r\n.", 250);
  @fwrite($s, "QUIT\r\n"); fclose($s);
  return $ok;
}

$err = '';
if (!empty($cfg['smtp_user'])) {
  $sent = smtp_send($cfg, $from, $to, $headers, $body, $err);
} else {
  [$hdrOnly] = [preg_replace('/^(To|Subject): .*\r\n/m', '', $headers . "\r\n")];
  $sent = mail($to, $subject, $body, rtrim($hdrOnly), '-f' . $from);
  if (!$sent) $err = 'mail()';
}
logline(($sent ? 'OK' : 'FAIL ' . $err) . ' page=' . $page . ' atts=' . count($atts));
$sent ? out(true) : out(false, 502, 'send');

/**
 * サロンドヴァンパッシオン試飲会（青山ブルゴーニュ.shop経由）
 * Google Apps Script — スプレッドシート記録 + 自動返信メール
 */

function doGet(e) {
  if (e.parameter && e.parameter.name) {
    return handleSubmission(JSON.stringify(e.parameter));
  }
  return ContentService
    .createTextOutput('Tasting form 2 API is running.')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var body = e.postData ? e.postData.contents : null;
  if (body) {
    return handleSubmission(body);
  }
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'error', message: 'No data' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleSubmission(raw) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var data = JSON.parse(raw);

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName('試飲会申込_回答') || ss.getSheets()[0];

    sheet.appendRow([
      Utilities.formatDate(new Date(), "Asia/Tokyo", "yyyy/MM/dd HH:mm:ss"),
      data.memberId,
      data.name,
      data.furigana,
      data.email,
      data.guests,
      data.source,
      '了承済み',
      'キャンセル待ち'
    ]);

    sendConfirmationEmail(data);

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function sendConfirmationEmail(data) {
  var subject = '【サロンドヴァンパッシオン】試飲会 お申込み受付のご確認';

  var summary =
    '　会員番号　　：' + data.memberId + '\n' +
    '　お名前　　　：' + data.name + '　様（' + data.furigana + '）\n' +
    '　参加人数　　：' + data.guests + '\n' +
    '　ご参加経路　：' + (data.source || '未回答') + '\n';

  var body =
    data.name + ' 様\n\n' +
    'この度はサロンドヴァンパッシオン試飲会にお申込みいただき、\n' +
    '誠にありがとうございます。\n\n' +
    '以下の内容でお申込みを承りました。\n\n' +
    '──────────────────────────────\n' +
    '【お申込み内容】\n' +
    summary +
    '──────────────────────────────\n\n' +
    'ご不明な点がございましたら、お気軽に公式LINEまでお問い合わせください。\n\n' +
    '本フォームの送信をもって、キャンセル待ちのお申し込みは完了となります。\n' +
    'キャンセルが発生した場合のみ、担当者よりLINEにて空きが出た際のご案内および決済用リンクをお送りいたします。\n' +
    'なお、決済完了をもってご予約確定となりますので、あらかじめご了承ください。\n\n' +
    '引き続きどうぞよろしくお願いいたします。\n\n' +
    '──────────────────────────────\n' +
    '　青山ブルゴーニュ.shop\n' +
    '──────────────────────────────\n';

  GmailApp.sendEmail(data.email, subject, body, {
    name: '青山ブルゴーニュ.shop',
    from: 'omakase.aoyama.garden@gmail.com'
  });
}

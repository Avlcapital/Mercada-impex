<?php
if($_POST) {
  $name = $_POST['name'];
  $email = $_POST['email'];
  $subject = $_POST['subject'];
  $message = $_POST['message'];

  $to = "davidmurage415@gmail.com";
  $headers = "From: $email";

  mail($to, $subject, "Message from: $name\n\n$message", $headers);
  echo "✅ Thank you! Your message has been sent.";
}
?>

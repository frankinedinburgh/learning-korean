export function speakKorean(text: string) {
  if (!('speechSynthesis' in window)) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  window.speechSynthesis.cancel() // stop anything already playing
  window.speechSynthesis.speak(utterance)
}

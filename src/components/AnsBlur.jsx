import React from 'react'
import { Focus } from 'lucide-react'
import toast from 'react-hot-toast'
import { EyeOff } from 'lucide-react'
import './AnsBlur.css'

const AnsBlur = ({ 
  questionKey, 
  focusedAnswer, 
  setFocusedAnswer, 
  size = 12,
  className = ''
}) => {
  
  // Function to toggle focus mode for an answer
  const toggleFocusMode = (questionKey) => {
    if (focusedAnswer === questionKey) {
      setFocusedAnswer(null)
      // Remove blur effect from body and clear focused answer
      document.body.classList.remove('answer-focus-mode')
      // Remove active-focus class from all questions
      document.querySelectorAll('.individual-question.active-focus, .bookmark-question.active-focus').forEach(el => {
        el.classList.remove('active-focus')
      })
      toast.success('Focus mode disabled', { duration: 1500, icon: <EyeOff size={16} /> })
    } else {
      setFocusedAnswer(questionKey)
      // Add blur effect to body
      document.body.classList.add('answer-focus-mode')
      // Remove active-focus from all questions first
      document.querySelectorAll('.individual-question.active-focus, .bookmark-question.active-focus').forEach(el => {
        el.classList.remove('active-focus')
      })
      // Add active-focus to the target question container
      const targetQuestion = document.querySelector(`.individual-question[data-question-key="${questionKey}"], .bookmark-question[data-question-key="${questionKey}"]`)
      if (targetQuestion) {
        targetQuestion.classList.add('active-focus')
      }
      toast.success('Focus mode enabled', { duration: 1500, icon: <Focus size={16} /> })
    }
  }

  return (
    <button 
      className={`focus-answer-btn ${focusedAnswer === questionKey ? 'active' : ''} ${className}`}
      onClick={() => toggleFocusMode(questionKey)}
      title={focusedAnswer === questionKey ? "Exit focus mode" : "Focus on this answer"}
    >
      <Focus size={size} />
    </button>
  )
}

export default AnsBlur
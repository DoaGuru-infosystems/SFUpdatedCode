import React, { useState } from 'react';

const questions = {
  en: [
    "How often have you felt down, depressed, or hopeless in the past month?",
    "Do you often have trouble sleeping (insomnia or oversleeping)?",
    "Have you recently experienced changes in your appetite (eating less or more)?",
    "Do you often feel anxious or stressed?",
    "Do you have difficulty finding interest or pleasure in activities?",
    "Do you feel fatigued or low on energy?",
    "Do you have trouble concentrating?",
    "Do you feel self-critical or have low self-esteem?",
    "Are you dissatisfied or discontent with any aspect of your life?",
    "Do you often have pessimistic or negative thoughts about your future?"
  ],
  hi: [
    "पिछले महीने में आप कितनी बार उदास या निराश महसूस कर चुके हैं?",
    "क्या आपको अक्सर नींद की समस्या होती है (नींद न आना या ज्यादा सोना)?",
    "क्या आपने हाल ही में अपनी भूख में बदलाव महसूस किया है (कम भूख लगना या ज्यादा)?",
    "क्या आपको अक्सर चिंतित या तनावग्रस्त महसूस होता है?",
    "क्या आपको किसी काम में रुचि या आनंद महसूस करने में कठिनाई होती है?",
    "क्या आपको थकान या ऊर्जा की कमी महसूस होती है?",
    "क्या आपको ध्यान केंद्रित करने में समस्या होती है?",
    "क्या आप अपने आप को या अपनी क्षमताओं को लेकर आत्म-आलोचनात्मक महसूस करते हैं?",
    "क्या आप अपने जीवन के किसी भी पहलू से असंतुष्ट या असंतोषजनक महसूस करते हैं?",
    "क्या आपको अक्सर अपने भविष्य के बारे में निराशाजनक या नकारात्मक विचार आते हैं?"
  ]
};

const options = {
  en: ["Never", "Sometimes", "Often", "Always"],
  hi: ["कभी नहीं", "कभी-कभी", "अक्सर", "लगातार"]
};

const getScore = (responses) => {
  let score = 0;
  responses.forEach(response => {
    // Inverting the score to reflect "Never" as best and "Always" as worst
    score += (3 - response);
  });
  return (score / (questions.en.length * 3)) * 100;
}

const getScoreMessage = (score, language) => {
  if (language === 'en') {
    if (score >= 80) {
      return "Your mental health is good.";
    } else if (score >= 50) {
      return "Your mental health is moderate.";
    } else {
      return "Your mental health is poor.";
    }
  } else {
    if (score >= 80) {
      return "आपका मानसिक स्वास्थ्य अच्छा है।";
    } else if (score >= 50) {
      return "आपका मानसिक स्वास्थ्य मध्यम है।";
    } else {
      return "आपका मानसिक स्वास्थ्य खराब है।";
    }
  }
}

const Blank = () => {
  const [language, setLanguage] = useState('en');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState(Array(questions.en.length).fill(0));
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (value) => {
    const newResponses = [...responses];
    newResponses[currentQuestion] = value;
    setResponses(newResponses);
    if (currentQuestion < questions[language].length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setSubmitted(true);
    }
  }

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    setCurrentQuestion(0);
    setResponses(Array(questions[lang].length).fill(0));
    setSubmitted(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-lg w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600">Mental Health Check</h1>
        <div className="flex justify-center mb-6">
          <button
            className={`mx-2 px-4 py-2 rounded ${language === 'en' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleLanguageChange('en')}
          >
            English
          </button>
          <button
            className={`mx-2 px-4 py-2 rounded ${language === 'hi' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => handleLanguageChange('hi')}
          >
            हिंदी
          </button>
        </div>
        {!submitted ? (
          <div>
            <p className="mb-4 text-lg">{currentQuestion + 1}. {questions[language][currentQuestion]}</p>
            {options[language].map((option, index) => (
              <button 
                key={index} 
                className="block w-full text-left bg-blue-500 text-white px-4 py-2 mb-2 rounded hover:bg-blue-600"
                onClick={() => handleChange(index)}
              >
                {option}
              </button>
            ))}
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-bold text-center">{language === 'en' ? 'Your Mental Health Score' : 'आपका मानसिक स्वास्थ्य स्कोर'}</h2>
            <p className="text-3xl text-center mt-4">{getScore(responses)}%</p>
            <p className="text-xl text-center mt-4">{getScoreMessage(getScore(responses), language)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Blank;

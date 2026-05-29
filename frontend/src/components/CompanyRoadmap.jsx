import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle, Circle, Clock, Trophy, BookOpen } from 'lucide-react';

const CompanyRoadmap = ({ companyId }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [progress, setProgress] = useState(null);
  const [expandedWeek, setExpandedWeek] = useState(null);
  
  useEffect(() => {
    if (companyId) {
      fetchRoadmap();
      fetchProgress();
    }
  }, [companyId]);
  
  const fetchRoadmap = async () => {
    const response = await axios.get(`/api/roadmaps/${companyId}`);
    setRoadmap(response.data);
  };
  
  const fetchProgress = async () => {
    const response = await axios.get(`/api/roadmaps/progress/${companyId}`, {
      headers: { 'userId': 'current-user-id' }
    });
    setProgress(response.data);
  };
  
  const markComplete = async (week, topicName) => {
    await axios.post(`/api/roadmaps/mark-complete`, {
      companyId,
      week,
      topicName
    }, {
      headers: { 'userId': 'current-user-id' }
    });
    fetchProgress(); // Refresh
  };
  
  const isTopicCompleted = (week, topicName) => {
    return progress?.progress?.some(
      p => p.stageWeek === week && p.topicName === topicName && p.completed
    );
  };
  
  if(!roadmap) return <div className="animate-pulse text-white">Loading roadmap...</div>;
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold">{roadmap.companyName}</h1>
            <p className="text-indigo-200 mt-2">Preparation Roadmap</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{progress?.overallProgress || 0}%</div>
            <p className="text-indigo-200">Complete</p>
          </div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-3">
          <div className="bg-white rounded-full h-3 transition-all duration-500"
               style={{ width: `${progress?.overallProgress || 0}%` }} />
        </div>
        <div className="flex gap-6 mt-6">
          <div className="flex items-center gap-2">
            <Clock size={18} />
            <span>{roadmap.totalWeeks} Weeks</span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy size={18} />
            <span>{roadmap.difficulty}</span>
          </div>
          <div className="flex items-center gap-2">
            <BookOpen size={18} />
            <span>{roadmap.avgPackage} Average CTC</span>
          </div>
        </div>
      </div>
      
      {/* Weeks Timeline */}
      <div className="space-y-4">
        {roadmap.stages.map((stage, idx) => (
          <div key={idx} className="bg-gray-800 rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedWeek(expandedWeek === idx ? null : idx)}
              className="w-full p-6 text-left flex justify-between items-center hover:bg-gray-700/50 transition"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-indigo-400">Week {stage.week}</span>
                  <h3 className="text-xl font-semibold text-white">{stage.title}</h3>
                </div>
                <p className="text-gray-400 mt-1">{stage.topics.length} topics</p>
              </div>
              <div className="text-indigo-400">
                {expandedWeek === idx ? '▼' : '▶'}
              </div>
            </button>
            
            {expandedWeek === idx && (
              <div className="border-t border-gray-700 p-6 space-y-4">
                {stage.topics.map((topic, topicIdx) => {
                  const completed = isTopicCompleted(stage.week, topic.name);
                  
                  return (
                    <div key={topicIdx} className="bg-gray-700/30 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {completed ? (
                              <CheckCircle className="text-green-400" size={20} />
                            ) : (
                              <Circle className="text-gray-500" size={20} />
                            )}
                            <h4 className="text-white font-semibold">{topic.name}</h4>
                          </div>
                          <p className="text-gray-400 text-sm mt-2">
                            📚 {topic.problemsToSolve} problems • ⏱️ {topic.estimatedHours} hours
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {topic.resources && topic.resources.map((resource, resIdx) => (
                              <a key={resIdx} href={resource} target="_blank" rel="noreferrer"
                                 className="text-xs bg-indigo-600/20 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-600/40 transition">
                                Resource {resIdx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                        {!completed && (
                          <button
                            onClick={() => markComplete(stage.week, topic.name)}
                            className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition ml-4 shrink-0"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CompanyRoadmap;

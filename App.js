import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout,
  SlideInDown,
  SlideOutUp,
  BounceIn,
} from 'react-native-reanimated';
import tw from 'twrnc';

const isValidDateString = (dateString) => {
  const regex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
  return regex.test(dateString);
};

const isValidTimeString = (timeString) => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return regex.test(timeString);
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [score, setScore] = useState(0);

  const [goalPoints, setGoalPoints] = useState(0);
  const [goalModalVisible, setGoalModalVisible] = useState(false);
  const [goalInput, setGoalInput] = useState('');
  const [goalAchievedModalVisible, setGoalAchievedModalVisible] = useState(false);

  const [filter, setFilter] = useState('all');

  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDateText, setDueDateText] = useState('');
  const [dueTimeText, setDueTimeText] = useState('');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDueDateText, setEditDueDateText] = useState('');
  const [editDueTimeText, setEditDueTimeText] = useState('');

  const addTask = () => {
    if (title.trim() === '') {
      Alert.alert('Missing Title', 'Please enter a task title.');
      return;
    }
    if (!isValidDateString(dueDateText)) {
      Alert.alert(
        'Invalid Date',
        'Please enter a valid due date in MM/DD/YYYY format.'
      );
      return;
    }
    if (!isValidTimeString(dueTimeText)) {
      Alert.alert(
        'Invalid Time',
        'Please enter a valid time in HH:MM format (24-hour).'
      );
      return;
    }
    const [month, day, year] = dueDateText.split('/').map(Number);
    const [hour, minute] = dueTimeText.split(':').map(Number);
    const deadline = new Date(year, month - 1, day, hour, minute, 0);
    if (isNaN(deadline.getTime())) {
      Alert.alert('Invalid Date/Time', 'The provided date/time is invalid.');
      return;
    }
    const newTask = {
      id: Date.now().toString(),
      title: title.trim(),
      description: description.trim(),
      deadline, 
      status: 'active',
      expiredAwarded: false,
    };
    setTasks([...tasks, newTask]);
    setTitle('');
    setDescription('');
    setDueDateText('');
    setDueTimeText('');
    setModalVisible(false);
  };

  const updateTask = () => {
    if (editTitle.trim() === '') {
      Alert.alert('Missing Title', 'Please enter a task title.');
      return;
    }
    if (!isValidDateString(editDueDateText)) {
      Alert.alert(
        'Invalid Date',
        'Please enter a valid due date in MM/DD/YYYY format.'
      );
      return;
    }
    if (!isValidTimeString(editDueTimeText)) {
      Alert.alert(
        'Invalid Time',
        'Please enter a valid time in HH:MM format (24-hour).'
      );
      return;
    }
    const [month, day, year] = editDueDateText.split('/').map(Number);
    const [hour, minute] = editDueTimeText.split(':').map(Number);
    const newDeadline = new Date(year, month - 1, day, hour, minute, 0);
    if (isNaN(newDeadline.getTime())) {
      Alert.alert('Invalid Date/Time', 'The provided date/time is invalid.');
      return;
    }
    const updatedTask = {
      ...editingTask,
      title: editTitle.trim(),
      description: editDescription.trim(),
      deadline: newDeadline,
      status: newDeadline < new Date() ? 'expired' : 'active',
      expiredAwarded: false,
    };
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === editingTask.id ? updatedTask : task))
    );
    setEditModalVisible(false);
    setEditingTask(null);
    setEditTitle('');
    setEditDescription('');
    setEditDueDateText('');
    setEditDueTimeText('');
  };

  const toggleTask = (id) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => {
        if (task.id === id && task.status === 'active') {
          setScore((prevScore) => prevScore + 10);
          return { ...task, status: 'completed' };
        }
        return task;
      })
    );
  };

  const removeTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter((task) => task.status === 'active'));
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.status === 'active' && task.deadline < now) {
            let updatedTask = { ...task, status: 'expired' };
            if (task.description.trim() !== '' && !task.expiredAwarded) {
              setScore((prevScore) => prevScore - 10);
              updatedTask.expiredAwarded = true;
            }
            return updatedTask;
          }
          return task;
        })
      );
    }, 60000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (goalPoints > 0 && score >= goalPoints) {
      setGoalAchievedModalVisible(true);
    }
  }, [score, goalPoints]);

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') {
      const today = new Date();
      return (
        task.status === 'active' &&
        task.deadline.getMonth() === today.getMonth() &&
        task.deadline.getDate() === today.getDate()
      );
    }
    if (filter === 'completed') {
      return task.status === 'completed' || task.status === 'expired';
    }
    return true;
  });

  const getTaskBgColor = (task) => {
    if (task.status === 'completed') {
      return task.description.trim() !== '' ? 'bg-green-100' : 'bg-green-50';
    } else if (task.status === 'expired') {
      return task.description.trim() !== '' ? 'bg-red-100' : 'bg-red-50';
    }
    return 'bg-white';
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description);
    const d = task.deadline;
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const year = d.getFullYear().toString();
    setEditDueDateText(`${month}/${day}/${year}`);
    const hour = d.getHours().toString().padStart(2, '0');
    const minute = d.getMinutes().toString().padStart(2, '0');
    setEditDueTimeText(`${hour}:${minute}`);
    setEditModalVisible(true);
  };

  const renderItem = ({ item }) => (
    <Animated.View
      entering={SlideInDown.duration(300)}
      exiting={SlideOutUp.duration(300)}
      layout={Layout.springify()}
      style={[
        tw`rounded-xl p-4 mb-4 flex-row items-center`,
        tw`${getTaskBgColor(item)} shadow-md`,
      ]}
    >
      <TouchableOpacity onPress={() => toggleTask(item.id)} style={tw`mr-4`}>
        <View
          style={[
            tw`w-6 h-6 border-2 rounded-full justify-center items-center`,
            item.status === 'completed'
              ? tw`bg-green-500 border-green-500`
              : item.status === 'expired'
              ? tw`bg-red-500 border-red-500`
              : tw`border-gray-400`,
          ]}
        >
          {item.status === 'completed' && (
            <Text style={tw`text-white text-xs`}>✓</Text>
          )}
          {item.status === 'expired' && (
            <Text style={tw`text-white text-xs`}>X</Text>
          )}
        </View>
      </TouchableOpacity>

      <View style={tw`flex-1`}>
        <Text style={[tw`text-xl font-bold`, item.status !== 'active' && tw`line-through`]}>
          {item.title}
        </Text>
        {item.description ? (
          <Text style={[tw`mt-1`, item.status !== 'active' && tw`line-through`]}>
            {item.description}
          </Text>
        ) : null}
        <Text style={tw`mt-1 text-sm text-gray-500`}>
          Due: {item.deadline.toLocaleDateString()} {item.deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
        {item.status === 'expired' && (
          <Animated.Text entering={BounceIn.duration(500)} style={tw`text-2xl ml-2`}>
            😢
          </Animated.Text>
        )}
        {item.status === 'completed' && (
          <Animated.Text entering={BounceIn.duration(500)} style={tw`text-2xl ml-2`}>
            😊
          </Animated.Text>
        )}
      </View>

      <View style={tw`flex-row items-center`}>
        <TouchableOpacity onPress={() => openEditModal(item)}>
          <Text style={tw`text-blue-500 font-bold mr-4`}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => removeTask(item.id)}>
          <Text style={tw`text-red-500 font-bold`}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={tw`flex-1 bg-gray-50`}>
      <View style={tw`bg-blue-500 py-9 px-4 shadow-xl`}>
        <Text style={tw`text-white text-4xl font-extrabold text-center` }>
          Task Manager
        </Text>
        <View style={tw`mt-2 flex-row justify-center items-center`}>
          <Text style={[tw`text-2xl font-bold`, score < 0 ? tw`text-red-500` : tw`text-white`]}>
            Points: {score}
          </Text>
          {goalPoints > 0 && (
            <Text style={tw`text-white ml-4 text-lg`}>Goal: {goalPoints}</Text>
          )}
        </View>
        <View style={tw`mt-3 flex-row justify-center`}>
          <TouchableOpacity
            onPress={() => setScore(0)}
            style={tw`bg-white rounded-full px-3 py-1 mr-3`}
          >
            <Text style={tw`text-blue-500 font-bold`}>Reset Points</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setGoalModalVisible(true)}
            style={tw`bg-white rounded-full px-3 py-1`}
          >
            <Text style={tw`text-blue-500 font-bold`}>Set Goal</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={tw`flex-row justify-around p-4`}>
        <TouchableOpacity
          onPress={() => setFilter('all')}
          style={tw`px-4 py-2 rounded-full ${filter === 'all' ? 'bg-blue-500' : 'bg-gray-200'}`}
        >
          <Text style={filter === 'all' ? tw`text-white font-bold` : tw`text-gray-700`}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('active')}
          style={tw`px-4 py-2 rounded-full ${filter === 'active' ? 'bg-blue-500' : 'bg-gray-200'}`}
        >
          <Text style={filter === 'active' ? tw`text-white font-bold` : tw`text-gray-700`}>Active (Today)</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setFilter('completed')}
          style={tw`px-4 py-2 rounded-full ${filter === 'completed' ? 'bg-blue-500' : 'bg-gray-200'}`}
        >
          <Text style={filter === 'completed' ? tw`text-white font-bold` : tw`text-gray-700`}>Completed</Text>
        </TouchableOpacity>
      </View>

      {tasks.some((task) => task.status !== 'active') && (
        <View style={tw`px-4 pb-2`}>
          <TouchableOpacity
            onPress={clearCompleted}
            style={tw`bg-red-500 rounded-full py-2 px-4 self-center shadow-md`}
          >
            <Text style={tw`text-white font-bold text-center`}>Clear Completed</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={tw`flex-1 p-4`}>
        {filteredTasks.length === 0 ? (
          <View style={tw`flex-1 justify-center items-center`}>
            <Text style={tw`text-gray-500 text-lg`}>No tasks found!</Text>
          </View>
        ) : (
          <FlatList data={filteredTasks} keyExtractor={(item) => item.id} renderItem={renderItem} />
        )}

        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          style={[tw`absolute bottom-8 right-8 bg-blue-500 p-4 rounded-full shadow-xl`, { elevation: 5 }]}
        >
          <Text style={tw`text-white text-2xl`}>+</Text>
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={tw`bg-white rounded-xl p-6 w-11/12 shadow-2xl`}>
            <Text style={tw`text-3xl font-bold mb-6 text-center`}>Add New Task</Text>
            <TextInput
              placeholder="Task Title"
              style={tw`border border-gray-300 rounded p-2 mb-4`}
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              placeholder="Task Description (optional)"
              style={tw`border border-gray-300 rounded p-2 mb-4`}
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <Text style={tw`text-lg font-semibold mb-2`}>Due Date (MM/DD/YYYY)</Text>
            <TextInput
              placeholder="MM/DD/YYYY"
              style={tw`border border-gray-300 rounded p-2 mb-4 text-center`}
              value={dueDateText}
              onChangeText={setDueDateText}
              keyboardType="default"
              maxLength={10}
            />
            <Text style={tw`text-lg font-semibold mb-2`}>Due Time (HH:MM)</Text>
            <TextInput
              placeholder="HH:MM"
              style={tw`border border-gray-300 rounded p-2 mb-4 text-center`}
              value={dueTimeText}
              onChangeText={setDueTimeText}
              keyboardType="default"
              maxLength={5}
            />
            <View style={tw`flex-row justify-end`}>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setDueDateText('');
                  setDueTimeText('');
                }}
                style={tw`mr-4`}
              >
                <Text style={tw`text-red-500 font-bold`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={addTask}>
                <Text style={tw`text-blue-500 font-bold`}>Add</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Update Task Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={tw`bg-white rounded-xl p-6 w-11/12 shadow-2xl`}>
            <Text style={tw`text-3xl font-bold mb-6 text-center`}>Update Task</Text>
            <TextInput
              placeholder="Task Title"
              style={tw`border border-gray-300 rounded p-2 mb-4`}
              value={editTitle}
              onChangeText={setEditTitle}
            />
            <TextInput
              placeholder="Task Description (optional)"
              style={tw`border border-gray-300 rounded p-2 mb-4`}
              value={editDescription}
              onChangeText={setEditDescription}
              multiline
            />
            <Text style={tw`text-lg font-semibold mb-2`}>Due Date (MM/DD/YYYY)</Text>
            <TextInput
              placeholder="MM/DD/YYYY"
              style={tw`border border-gray-300 rounded p-2 mb-4 text-center`}
              value={editDueDateText}
              onChangeText={setEditDueDateText}
              keyboardType="default"
              maxLength={10}
            />
            <Text style={tw`text-lg font-semibold mb-2`}>Due Time (HH:MM)</Text>
            <TextInput
              placeholder="HH:MM"
              style={tw`border border-gray-300 rounded p-2 mb-4 text-center`}
              value={editDueTimeText}
              onChangeText={setEditDueTimeText}
              keyboardType="default"
              maxLength={5}
            />
            <View style={tw`flex-row justify-end`}>
              <TouchableOpacity
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingTask(null);
                  setEditDueDateText('');
                  setEditDueTimeText('');
                }}
                style={tw`mr-4`}
              >
                <Text style={tw`text-red-500 font-bold`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={updateTask}>
                <Text style={tw`text-blue-500 font-bold`}>Update</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={goalModalVisible}
        onRequestClose={() => setGoalModalVisible(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} style={tw`bg-white rounded-xl p-6 w-10/12 shadow-2xl`}>
            <Text style={tw`text-2xl font-bold mb-4 text-center`}>Set Your Goal Points</Text>
            <TextInput
              placeholder="Enter goal (number)"
              style={tw`border border-gray-300 rounded p-2 mb-4 text-center`}
              value={goalInput}
              onChangeText={setGoalInput}
              keyboardType="number-pad"
            />
            <View style={tw`flex-row justify-end`}>
              <TouchableOpacity
                onPress={() => {
                  setGoalModalVisible(false);
                  setGoalInput('');
                }}
                style={tw`mr-4`}
              >
                <Text style={tw`text-red-500 font-bold`}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const goal = parseInt(goalInput, 10);
                  if (!isNaN(goal) && goal > 0) {
                    setGoalPoints(goal);
                    setGoalModalVisible(false);
                    setGoalInput('');
                  } else {
                    Alert.alert('Invalid Input', 'Please enter a valid number greater than 0.');
                  }
                }}
              >
                <Text style={tw`text-blue-500 font-bold`}>Set</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent={true}
        visible={goalAchievedModalVisible}
        onRequestClose={() => setGoalAchievedModalVisible(false)}
      >
        <View style={tw`flex-1 justify-center items-center bg-black bg-opacity-50`}>
          <Animated.View entering={BounceIn.duration(600)} style={tw`bg-white rounded-xl p-6 w-10/12 shadow-2xl`}>
            <Text style={tw`text-3xl font-bold mb-4 text-center`}>Congratulations! 🎉</Text>
            <Text style={tw`text-xl text-center mb-6`}>
              You've reached your goal of {goalPoints} points!
            </Text>
            <TouchableOpacity
              onPress={() => setGoalAchievedModalVisible(false)}
              style={tw`bg-blue-500 rounded-full py-2 px-4 self-center`}
            >
              <Text style={tw`text-white font-bold`}>Awesome!</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

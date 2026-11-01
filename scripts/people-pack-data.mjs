export const historyNames = `
Tutankhamun
Hammurabi
Cleopatra VII
Alexander the Great
Julius Caesar
Confucius
Ashoka the Great
Hannibal Barca
Hypatia
Boudica
Genghis Khan
Mansa Musa
Joan of Arc
Leonardo da Vinci
Suleiman the Magnificent
Oda Nobunaga
Sejong the Great
Elizabeth I of England
Christopher Columbus
Galileo Galilei
Isaac Newton
Peter the Great
George Washington
Catherine the Great
Nader Shah
Wolfgang Amadeus Mozart
Toussaint Louverture
Rani of Jhansi
Benjamin Franklin
Voltaire
Napoleon Bonaparte
Simon Bolivar
Abraham Lincoln
Queen Victoria
Charles Darwin
Marie Curie
Sun Yat-sen
Shaka
Emperor Meiji
Florence Nightingale
Albert Einstein
Mahatma Gandhi
Winston Churchill
Nelson Mandela
Martin Luther King Jr.
Frida Kahlo
Amelia Earhart
Che Guevara
Yuri Gagarin
Mother Teresa
Akhenaten
Ramesses II
Nebuchadnezzar II
Cyrus the Great
Pericles
Socrates
Plato
Aristotle
Qin Shi Huang
Sun Tzu
Augustus
Marcus Aurelius
Constantine the Great
Attila
Justinian I
Wu Zetian
Charlemagne
Harun al-Rashid
Alfred the Great
Erik the Red
Leif Erikson
William the Conqueror
Saladin
Richard I of England
Marco Polo
Ibn Battuta
Zheng He
Vlad the Impaler
Moctezuma II
Atahualpa
Hernan Cortes
Ferdinand Magellan
Nicolaus Copernicus
Michelangelo
William Shakespeare
Rene Descartes
Miyamoto Musashi
Shah Jahan
Louis XIV
Tokugawa Ieyasu
Jean-Jacques Rousseau
Adam Smith
Maximilien Robespierre
Giuseppe Garibaldi
Otto von Bismarck
Karl Marx
Nikola Tesla
Thomas Edison
Sigmund Freud
Rosa Parks
`.trim().split('\n');

export const celebrityNames = [...new Set(`
Marilyn Monroe
Charlie Chaplin
Audrey Hepburn
Humphrey Bogart
Elizabeth Taylor
Marlon Brando
James Dean
Meryl Streep
Robert De Niro
Al Pacino
Denzel Washington
Tom Hanks
Leonardo DiCaprio
Brad Pitt
Morgan Freeman
Viola Davis
Cate Blanchett
Harrison Ford
Keanu Reeves
Will Smith
Johnny Depp
Tom Cruise
Scarlett Johansson
Samuel L. Jackson
Angelina Jolie
Pedro Pascal
Zendaya
Timothee Chalamet
Margot Robbie
Ryan Gosling
Florence Pugh
Cillian Murphy
Jenna Ortega
Austin Butler
Bryan Cranston
Steve Carell
Jennifer Aniston
Julia Louis-Dreyfus
Emilia Clarke
Peter Dinklage
Jennifer Lawrence
Mahershala Ali
Lupita Nyong'o
Emma Stone
Idris Elba
Benedict Cumberbatch
Millie Bobby Brown
Jason Sudeikis
Jeremy Allen White
Quinta Brunson
Clint Eastwood
Harrison Ford
Sylvester Stallone
Arnold Schwarzenegger
Bruce Willis
Nicolas Cage
Jim Carrey
Adam Sandler
Will Ferrell
Robin Williams
Keanu Reeves
Johnny Depp
Hugh Jackman
Robert Downey Jr.
Chris Hemsworth
Chris Evans
Ryan Reynolds
Dwayne Johnson
Jason Statham
Daniel Craig
Robert Pattinson
Paul Mescal
Jacob Elordi
Joseph Quinn
Andrew Garfield
Tom Holland
Austin Butler
Barry Keoghan
Michael B. Jordan
Oscar Isaac
Sandra Bullock
Julia Roberts
Nicole Kidman
Charlize Theron
Natalie Portman
Anne Hathaway
Emma Watson
Zendaya
Sydney Sweeney
Anya Taylor-Joy
Mia Goth
Sophie Thatcher
Mikey Madison
Cailee Spaeny
Phoebe Dynevor
Nicola Coughlan
Ayo Edebiri
Hannah Waddingham
Catherine O'Hara
Jean Smart
`.trim().split('\n'))];

export const peopleDisplayNames = new Map([
  ['Elizabeth I of England', 'Queen Elizabeth I'],
  ['Rani of Jhansi', 'Rani of Jhansi (Lakshmibai)'],
  ['Simon Bolivar', 'Simón Bolívar'],
  ['Shaka', 'Shaka Zulu'],
  ['Ramesses II', 'Ramses II'],
  ['Augustus', 'Augustus Caesar'],
  ['Attila', 'Attila the Hun'],
  ['Wu Zetian', 'Empress Wu Zetian'],
  ['Richard I of England', 'Richard the Lionheart'],
  ['Hernan Cortes', 'Hernán Cortés'],
  ['Rene Descartes', 'René Descartes'],
  ['Timothee Chalamet', 'Timothée Chalamet'],
  ['Dwayne Johnson', 'Dwayne "The Rock" Johnson'],
]);

export const personSearchOverrides = new Map([
  ['Rani of Jhansi', 'Lakshmibai Newalkar'],
  ['Shaka', 'Shaka Zulu'],
  ['Mother Teresa', 'Mother Teresa'],
  ['Joseph Quinn', 'Joseph Quinn (actor)'],
  ['Chris Evans', 'Chris Evans (actor)'],
]);

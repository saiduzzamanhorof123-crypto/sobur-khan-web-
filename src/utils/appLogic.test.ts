import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBDT,
  formatBDTRange,
  toBengaliDigits,
  localizeBDTString,
  calculateRegistrationTotals,
  calculateCollaborationTotals,
} from './currency';
import {
  createInitialEditorHistory,
  applyEditorChange,
  undoEditorHistory,
  redoEditorHistory,
  resetEditorHistory,
  resolveAspectRatio,
  computeObjectPosition,
  clampZoom,
  normalizeRotation,
} from './photoEditorState';
import {
  resolveFrameAspectCss,
  getSectionImageContainerProps,
  reorderSectionImages,
  isDefaultAssetUrl,
  formatAspectLabel,
  formatDisplaySizeLabel,
} from './imageDisplay';
import { ModelingCourse, StudentRegistration, CollaborationInquiry } from '../types';

test('toBengaliDigits converts ASCII digits to Bengali numerals cleanly', () => {
  assert.equal(toBengaliDigits('৳ 1,500'), '৳ ১,৫০০');
  assert.equal(toBengaliDigits('2026-11-13'), '২০২৬-১১-১৩');
});

test('formatBDT formats Bangladeshi Taka correctly and never emits USD $', () => {
  assert.equal(formatBDT(1500, 'en'), '৳ 1,500');
  assert.equal(formatBDT(150000, 'en'), '৳ 1,50,000');
  assert.equal(formatBDT(1500, 'bn'), '৳ ১,৫০০');
  assert.equal(formatBDT(null, 'en'), 'Fee Pending Confirmation (৳ BDT)');
  assert.equal(formatBDT(undefined, 'bn', 'Pending BDT'), 'Pending BDT');
  assert.equal(formatBDT(25000, 'en').includes('$'), false);
});

test('formatBDTRange and localizeBDTString support ranges and digit styles', () => {
  assert.equal(formatBDTRange(50000, 150000, 'en'), '৳ 50,000 – ৳ 1,50,000');
  assert.equal(formatBDTRange(50000, 150000, 'bn'), '৳ ৫০,০০০ – ৳ ১,৫০,০০০');
  assert.equal(formatBDTRange(300000, null, 'en'), '৳ 3,00,000+');
  assert.equal(localizeBDTString('৳ 50,000 - ৳ 1,50,000', 'bn'), '৳ ৫০,০০০ - ৳ ১,৫০,০০০');
});

test('calculateRegistrationTotals computes BDT revenue accurately and tracks unconfirmed fees', () => {
  const courses: ModelingCourse[] = [
    {
      id: 'c1',
      title: 'Beginner',
      tier: 'Beginner Modeling Course',
      feeAmount: 25000,
      currency: 'BDT',
      bdtConfirmed: true,
      schedule: '',
      duration: '',
      location: '',
      coverImage: '',
      description: '',
      syllabus: [],
      capacity: 10,
      enrolledCount: 2,
      status: 'published',
      createdAt: '',
      updatedAt: '',
    },
    {
      id: 'c2',
      title: 'Pro',
      tier: 'Professional Modeling Training',
      feeAmount: null,
      currency: 'BDT',
      bdtConfirmed: false,
      legacyUsdFee: '$750',
      schedule: '',
      duration: '',
      location: '',
      coverImage: '',
      description: '',
      syllabus: [],
      capacity: 10,
      enrolledCount: 1,
      status: 'published',
      createdAt: '',
      updatedAt: '',
    },
  ];

  const regs: StudentRegistration[] = [
    {
      id: 'r1',
      courseId: 'c1',
      courseTitle: 'Beginner',
      fullName: 'Tariq',
      email: 't@example.com',
      phone: '017',
      age: 22,
      height: '6ft',
      previousExperience: 'None',
      status: 'approved',
      paymentStatus: 'paid',
      currency: 'BDT',
      submittedAt: '',
    },
    {
      id: 'r2',
      courseId: 'c1',
      courseTitle: 'Beginner',
      fullName: 'Aarav',
      email: 'a@example.com',
      phone: '018',
      age: 20,
      height: '6ft',
      previousExperience: 'None',
      status: 'pending',
      paymentStatus: 'pending',
      currency: 'BDT',
      submittedAt: '',
    },
  ];

  const totals = calculateRegistrationTotals(regs, courses);
  assert.equal(totals.confirmedRevenueBdt, 25000);
  assert.equal(totals.pendingRevenueBdt, 25000);
  assert.equal(totals.paidCount, 1);
  assert.equal(totals.pendingCount, 1);
  assert.equal(totals.unconfirmedCourseFeeCount, 1);
});

test('calculateCollaborationTotals sums confirmed BDT campaign quotes', () => {
  const collabs: CollaborationInquiry[] = [
    {
      id: 'col1',
      companyName: 'Aureus',
      contactPerson: 'M',
      email: 'm@a.com',
      phone: '123',
      collaborationType: 'Brand Ambassador',
      budgetRange: '৳ 1,50,000 – ৳ 3,50,000',
      quotedAmountBdt: 250000,
      currency: 'BDT',
      details: 'Campaign',
      timeline: 'Q1',
      status: 'in_discussion',
      submittedAt: '',
    },
  ];

  const res = calculateCollaborationTotals(collabs);
  assert.equal(res.totalQuotedBdt, 250000);
  assert.equal(res.quotedCount, 1);
});

test('photoEditorState handles undo, redo, reset, aspect ratios, zoom, and rotation', () => {
  let history = createInitialEditorHistory({ aspectPreset: '4:5', zoom: 1, rotation: 0 });
  assert.equal(history.past.length, 0);
  assert.equal(history.present.zoom, 1);

  history = applyEditorChange(history, { zoom: 1.8, rotation: 90, position: { x: 40, y: 15 } });
  assert.equal(history.past.length, 1);
  assert.equal(history.present.zoom, 1.8);
  assert.equal(history.present.rotation, 90);
  assert.equal(history.present.objectPosition, '40% 15%');

  history = applyEditorChange(history, { aspectPreset: '16:9' });
  assert.equal(history.past.length, 2);
  assert.equal(history.present.aspectPreset, '16:9');

  history = undoEditorHistory(history);
  assert.equal(history.present.aspectPreset, '4:5');
  assert.equal(history.present.zoom, 1.8);
  assert.equal(history.future.length, 1);

  history = redoEditorHistory(history);
  assert.equal(history.present.aspectPreset, '16:9');
  assert.equal(history.future.length, 0);

  history = resetEditorHistory(history, 'original');
  assert.equal(history.present.zoom, 1);
  assert.equal(history.present.rotation, 0);
  assert.equal(history.present.aspectPreset, 'original');

  // Undo reset works too
  history = undoEditorHistory(history);
  assert.equal(history.present.aspectPreset, '16:9');
  assert.equal(history.present.zoom, 1.8);

  // Utility helpers
  assert.equal(resolveAspectRatio('1:1', 1000, 500), 1);
  assert.equal(resolveAspectRatio('3:4', 1000, 500), 0.75);
  assert.equal(resolveAspectRatio('original', 1200, 600), 2);
  assert.equal(resolveAspectRatio('custom', 1000, 500, { width: 21, height: 9 }), 21 / 9);
  assert.equal(computeObjectPosition(-10, 120), '0% 100%');
  assert.equal(clampZoom(10), 4);
  assert.equal(normalizeRotation(270), -90);
});

test('photoEditorState keeps displaySize and fitMode completely independent of crop zoom', () => {
  let history = createInitialEditorHistory({
    aspectPreset: '16:9',
    zoom: 1.6,
    displaySize: 'medium',
    fitMode: 'cover',
  });
  history = applyEditorChange(history, { displaySize: 'small', fitMode: 'contain' });
  assert.equal(history.present.displaySize, 'small');
  assert.equal(history.present.fitMode, 'contain');
  assert.equal(history.present.zoom, 1.6);

  history = applyEditorChange(history, { displaySize: 'large' });
  assert.equal(history.present.displaySize, 'large');
  assert.equal(history.present.zoom, 1.6);
});

test('imageDisplay utilities compute section-specific containers, aspect ratios, ordering, and default URLs cleanly', () => {
  assert.equal(resolveFrameAspectCss({ aspectPreset: '1:1' }, '16 / 9'), '1 / 1');
  assert.equal(resolveFrameAspectCss({ aspectPreset: '4:5' }, '16 / 9'), '4 / 5');
  assert.equal(
    resolveFrameAspectCss({ aspectPreset: 'custom', customRatio: { width: 21, height: 9 } }),
    '21 / 9'
  );
  assert.equal(
    resolveFrameAspectCss({
      aspectPreset: 'free',
      croppedAreaPixels: { x: 0, y: 0, width: 800, height: 1000 },
    }),
    '800 / 1000'
  );

  const smallCourse = getSectionImageContainerProps('courses', {
    displaySize: 'small',
    fitMode: 'contain',
    aspectPreset: '16:9',
  });
  assert.equal(smallCourse.displaySize, 'small');
  assert.equal(smallCourse.fitMode, 'contain');
  assert.equal(smallCourse.wrapperStyle.maxWidth, 'min(100%, 260px)');
  assert.equal(smallCourse.imgStyle.objectFit, 'contain');

  const awardDefault = getSectionImageContainerProps('awards', null, '1 / 1');
  assert.equal(awardDefault.fitMode, 'contain');
  assert.equal(awardDefault.displaySize, 'medium');

  const reordered = reorderSectionImages(
    [
      { id: 'a', url: '/1.jpg', order: 0 },
      { id: 'b', url: '/2.jpg', order: 1 },
      { id: 'c', url: '/3.jpg', order: 2 },
    ],
    0,
    1
  );
  assert.deepEqual(
    reordered.map((x) => x.id),
    ['b', 'a', 'c']
  );
  assert.deepEqual(
    reordered.map((x) => x.order),
    [0, 1, 2]
  );

  assert.equal(isDefaultAssetUrl('/src/assets/images/hero_sobur_portrait_1794476542316.jpg'), true);
  assert.equal(isDefaultAssetUrl('/uploads/my_photo_123.png'), false);
  assert.equal(formatAspectLabel('free'), 'Free');
  assert.equal(formatDisplaySizeLabel('large'), 'Large');
});


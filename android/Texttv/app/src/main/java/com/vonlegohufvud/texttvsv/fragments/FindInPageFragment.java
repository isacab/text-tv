package com.vonlegohufvud.texttvsv.fragments;

import android.content.Context;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.InputMethodManager;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.TextView;

import androidx.fragment.app.Fragment;

import com.vonlegohufvud.texttvsv.R;

import io.reactivex.Observable;
import io.reactivex.subjects.PublishSubject;

public class FindInPageFragment extends Fragment {

  private PublishSubject<String> mTextChangedSubject = PublishSubject.create();
  private PublishSubject<Boolean> mFindNextClickSubject = PublishSubject.create();

  private EditText mEditText;
  private ImageButton mCloseButton;
  private ImageButton mNextButton;
  private ImageButton mPrevButton;
  private TextView mFindResultTextView;

  @Override
  public View onCreateView(LayoutInflater inflater, ViewGroup container,
                           Bundle savedInstanceState) {
    View v = inflater.inflate(R.layout.fragment_findinpage, container, false);

    mEditText = v.findViewById(R.id.findInPageEditText);
    mEditText.addTextChangedListener(new TextWatcher() {
      @Override
      public void beforeTextChanged(CharSequence s, int start, int count, int after) { }
      @Override
      public void afterTextChanged(Editable s) { }
      @Override
      public void onTextChanged(CharSequence s, int start, int before, int count) {
        mTextChangedSubject.onNext(s.toString());
      }
    });
    mEditText.setOnFocusChangeListener(new View.OnFocusChangeListener() {
      @Override
      public void onFocusChange(View v, boolean hasFocus) {
        if(hasFocus) {
          // show keyboard
          InputMethodManager imm = (InputMethodManager) getActivity().getSystemService(Context.INPUT_METHOD_SERVICE);
          imm.showSoftInput(mEditText, InputMethodManager.SHOW_IMPLICIT);
        } else {
          // hide keyboard
          InputMethodManager imm = (InputMethodManager) getActivity().getSystemService(Context.INPUT_METHOD_SERVICE);
          imm.hideSoftInputFromWindow(mEditText.getWindowToken(), 0);
        }
      }
    });

    mCloseButton = v.findViewById(R.id.buttonCloseFindInPage);
    mCloseButton.setOnClickListener(new View.OnClickListener() {
      public void onClick(View v) {
        mEditText.clearFocus();
        getActivity().onBackPressed();
      }
    });
    mCloseButton.requestFocus();

    mNextButton = v.findViewById(R.id.buttonNextResult);
    mNextButton.setOnClickListener(new View.OnClickListener() {
      public void onClick(View v) {
        mEditText.clearFocus();
        mFindNextClickSubject.onNext(true);
      }
    });
    mNextButton.setEnabled(false);

    mPrevButton = v.findViewById(R.id.buttonPrevResult);
    mPrevButton.setOnClickListener(new View.OnClickListener() {
      public void onClick(View v) {
        mEditText.clearFocus();
        mFindNextClickSubject.onNext(false);
      }
    });
    mPrevButton.setEnabled(false);

    mFindResultTextView = v.findViewById(R.id.textViewFindResult);

    return v;
  }

  public Observable<String> textChanged() {
    return mTextChangedSubject.hide();
  }

  public Observable<Boolean> findNextClick() {
    return mFindNextClickSubject.hide();
  }

  public void setFindResult(int activeMatchOrdinal, int numberOfMatches) {
    if(mEditText.getText().length() > 0) {
      if (numberOfMatches == 0) {
        mFindResultTextView.setText("0/0");
      } else {
        mFindResultTextView.setText(String.valueOf(activeMatchOrdinal+1) + "/" + String.valueOf(numberOfMatches));
      }
    }
    else {
      mFindResultTextView.setText("");
    }

    // show hide next/prev buttons
    if (numberOfMatches == 0) {
      mNextButton.setEnabled(false);
      mPrevButton.setEnabled(false);
    } else {
      mNextButton.setEnabled(true);
      mPrevButton.setEnabled(true);
    }
  }

  public boolean focus() {
    return mEditText.requestFocus();
  }

  public void clearFocus() {
    mEditText.clearFocus();
  }

  public String getSearchString() {
    return mEditText.getText().toString();
  }

}
